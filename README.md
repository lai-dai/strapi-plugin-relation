# strapi-plugin-relation

Đây là `custom field` cho `stapi v5` có thể thêm bộ lọc tùy chỉnh hoặc có lọc với 1 `relation field` khác (chỉ one relation)

Dùng cho `Collection types`, `single types`, có thể dùng trong `Dynamic zone` & `Component`

Demo (đang cập nhật)

## Guide

Selected path:

```
/content-manager/relations/{MODEL}/{ID}/{RELATION_NAME}
or
/content-manager/relations/{MODEL}/{ID}/articles
```

Select path:

```
/content-manager/relations/{MODEL}/{RELATION_NAME}
or
/content-manager/relations/{MODEL}/articles
```

Select path with filters

```
/content-manager/relations/{MODEL}/{RELATION_NAME}?filters[category][$eq]=1
```

Select path with filter & parent relation id

```
/content-manager/relations/page.nav-child/articles?filters[category][$eq]={PARENT_RELATION_ID}
```

### Params builder

[interactive-query-builder](https://docs.strapi.io/dev-docs/api/rest/interactive-query-builder)

### Relation name

DYNAMIC ZONE

```
Level 1
{DYNAMIC1}.{INDEX1}.category

Level 2
{DYNAMIC1}.{INDEX1}.{DYNAMIC2}.{INDEX2}.articles
```

COMPONENT SINGLE & COMPONENT REPEATABLE (is same)

```
Level 1
{DYNAMIC1}.{INDEX1}.category

Level 2
{COMPONENT1}.{INDEX1}.{COMPONENT2}.{INDEX2}.articles
```

Relation Name -> regex by relationName.match(/\w+|\d+/g)
