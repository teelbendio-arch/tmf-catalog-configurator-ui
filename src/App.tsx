
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { useEffect, useState } from 'react'
import { Button, Card, Spin, Tabs, message, Modal, Form, Input, InputNumber } from 'antd'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import FS from '@isomorphic-git/lightning-fs'
import YAML from 'js-yaml'

const fs = new FS('tmf-catalog')
const dir = '/catalog'
const repoUrl: string = prompt('Git URL (Enter для примера)', 'https://github.com/teelbendio-arch/tmf-catalog-configurator.git') ?? 'https://github.com/teelbendio-arch/tmf-catalog-configurator.git'

function App() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [branch, setBranch] = useState('main')
  const [branches, setBranches] = useState<string[]>([])
  const [catalog, setCatalog] = useState<any>({ products: [] })
  const [editModal, setEditModal] = useState<{open: boolean, record?: any, file?: string}>({open: false})

  useEffect(() => { initRepo() }, [])

  async function initRepo() {
    try {
      await (fs as any).promises.mkdir(dir, { recursive: true })
      await git.clone({ fs, http, dir, url: repoUrl, singleBranch: true, depth: 1 })
      await loadBranches()
      await loadCatalog()
    } catch { message.error('Clone failed — check URL') }
    setLoading(false)
  }

  async function loadBranches() {
    const list = await git.listBranches({ fs, dir })
    setBranches(list)
  }

  async function switchBranch(b: string) {
    setLoading(true)
    await git.checkout({ fs, dir, ref: b })
    setBranch(b)
    await loadCatalog()
    setLoading(false)
    message.success(`Workspace: ${b}`)
  }

  async function loadCatalog() {
    const products: any[] = []
    try {
      const files = await fs.promises.readdir(`${dir}/products`)
      for (const f of files.filter(f => f.endsWith('.yaml'))) {
        const raw = await fs.promises.readFile(`${dir}/products/${f}`, 'utf8')
        products.push({ file: f, data: YAML.load(raw) })
      }
    } catch {}
    setCatalog({ products })
  }

  async function saveProduct(values: any) {
    const file = editModal.file || `${values.id}.yaml`
    const yaml = YAML.dump(values)
    await fs.promises.writeFile(`${dir}/products/${file}`, yaml)
    await git.add({ fs, dir, filepath: `products/${file}` })
    await git.commit({ fs, dir, message: `Edit ${values.id}`, author: { name: 'UI', email: 'ui@tmf' } })
    message.success('Saved & committed!')
    setEditModal({open: false})
    await loadCatalog()
  }

  async function createBranch() {
    const name = prompt('New workspace name?')

    console.log('Creating branch new:', name);

    if (!name) return
    await git.branch({ fs, dir, ref: name })
    await switchBranch(name)
  }

  async function mergeToMain() {
    if (branch === 'main') return
    Modal.confirm({
      title: `Merge ${branch} → main = DEPLOY?`,
      onOk: async () => {
        setLoading(true)
        await git.checkout({ fs, dir, ref: 'main' })
        try {
          await git.merge({ fs, dir, theirs: branch, author: { name: 'UI' } })
          message.success('Deployed! built-catalog.json in 10 sec')
        } catch { message.error('Conflict — open GitHub') }
        setBranch('main')
        await loadCatalog()
        setLoading(false)
      }
    })
  }

  if (loading) return <Spin tip="Git sync..." style={{ margin: 100 }} />


  return (
    <div style={{ padding: 24 }}>
      <h1>TMF Catalog UI — Git = DB</h1>
      <Button onClick={createBranch} type="dashed" style={{ marginBottom: 16 }}>New Workspace</Button>

      <Tabs
        activeKey={branch}
        onChange={switchBranch}
        tabBarExtraContent={branch !== 'main' && <Button type="primary" danger onClick={mergeToMain}>Merge → Deploy</Button>}
        items={branches.map(b => ({
          key: b,
          label: b === 'main' ? 'PROD' : b,
          children: (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {catalog.products.map((p: any) => (
                <Card
                  key={p.file}
                  title={p.data.name}
                  extra={<Button size="small" onClick={() => setEditModal({open: true, record: p.data, file: p.file})}>Edit</Button>}
                >
                  <p><b>ID:</b> {p.data.id}</p>
                  <p>{p.data.description}</p>
                  <p><i>{p.data.lifecycleStatus}</i></p>
                </Card>
              ))}
              <Card hoverable onClick={() => setEditModal({open: true})} style={{ textAlign: 'center' }}>
                <h3>+ Add Product</h3>
              </Card>
            </div>
          )
        }))}
      />

      <Modal title="Edit Product" open={editModal.open} footer={null} onCancel={() => setEditModal({open: false})}>
        <Form initialValues={editModal.record} onFinish={saveProduct} layout="vertical">
          <Form.Item name="id" label="ID" rules={[{ required: true }]}>
            <Input disabled={!!editModal.file} />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="lifecycleStatus" label="Status" initialValue="Active">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit">Save & Commit</Button>
        </Form>
      </Modal>
    </div>
  )


  // return (
  //   <>
  //     <div>
  //       <a href="https://vite.dev" target="_blank">
  //         <img src={viteLogo} className="logo" alt="Vite logo" />
  //       </a>
  //       <a href="https://react.dev" target="_blank">
  //         <img src={reactLogo} className="logo react" alt="React logo" />
  //       </a>
  //     </div>
  //     <h1>Vite + React</h1>
  //     <div className="card">
  //       <button onClick={() => setCount((count) => count + 1)}>
  //         count is {count}
  //       </button>
  //       <p>
  //         Edit <code>src/App.tsx</code> and save to test HMR
  //       </p>
  //     </div>
  //     <p className="read-the-docs">
  //       Click on the Vite and React logos to learn more
  //     </p>
  //   </>
  // )
}

export default App
