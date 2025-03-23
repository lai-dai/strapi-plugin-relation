# strapi-plugin-relation

Đây là lại `custom field` cho `stapi v5` có thể tùy chọn thêm bộ lọc tùy chỉnh hoặc quan hệ với 1 `relation field` khác (chỉ one relation)

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

Relation Name

```
nav_items.{INDEX1}.items.{INDEX2}.articles
```

Parent Relation Name

```
nav_items.{INDEX1}.items.{INDEX2}.category
or
nav_items.{INDEX1}.category
```

Relation Name -> regex by relationName.match(/\w+|\d+/g)
