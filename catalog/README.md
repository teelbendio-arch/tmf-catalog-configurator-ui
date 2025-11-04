# TMF Product Catalog — Git as Database

Этот репозиторий — **единственная правда** для Commercial Catalog Service.

## Структура
```
/products/*.yaml       → ProductSpecification
/offers/*.yaml         → ProductOffering
/attributes/*.yaml     → CharacteristicSpecification
/commitments/*.yaml    → TargetProductRelationship
/prices/*.yaml         → ProductOfferingPrice
/rules/*.yaml          → Constraint / PolicyRule
```

## Workspaces
- Ветка `main` — production (только built-catalog.json)
- Любая другая ветка — изолированный workspace
- Merge → main = Deploy

## Deploy
GitHub Actions на push в main генерирует `dist/built-catalog.json`
