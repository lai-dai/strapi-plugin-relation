# strapi-plugin-relation

Đây là `custom field` cho `stapi v5` có thể thêm bộ lọc tùy chỉnh hoặc có lọc với 1 `relation field` khác (chỉ one relation)

Dùng cho `Collection types`, `single types`, có thể dùng trong `Dynamic zone` & `Component`

Demo (đang cập nhật)

## Guide

### Relation name (yêu cầu)

#### DYNAMIC ZONE || COMPONENT REPEATABLE (is same)

```
Level 1
{DYNAMIC1}.{INDEX1}.category

Level 2
{DYNAMIC1}.{INDEX1}.{DYNAMIC2}.{INDEX2}.category

or

Level 1
{COMPONENT1}.{INDEX1}.category

Level 2
{COMPONENT1}.{INDEX1}.{COMPONENT2}.{INDEX2}.category
```

#### COMPONENT REPEATABLE with COMPONENT SINGLE

```
Level 2
{COMPONENT1}.{INDEX1}.{COMPONENT2}.category
```

#### COMPONENT SINGLE

```
Level 1
{COMPONENT1}.category

Level 2
{COMPONENT1}.{COMPONENT2}.category
```

#### COMPONENT SINGLE with COMPONENT REPEATABLE

```
Level 2
{COMPONENT1}.{COMPONENT3}.{INDEX1}.category
```

Checked by Regex :`relationName.match(/\w+|\d+/g)`

### Main field (yêu cầu)

Trường hiển thị (label) cho relation field (theo cài đặt)

### Select path

#### Without Filter (select all)

Khi chọn entry (có thể nhập trực tiếp hoặc gián tiếp theo cú pháp)

```
/content-manager/relations/{MODEL}/{RELATION_NAME}
or
/content-manager/relations/api::author.author/articles
```

#### With filters (yêu cầu khi có `Parent relation name`)

Khi chọn với bộ lọc (có thể nhập trực tiếp hoặc gián tiếp theo cú pháp) (không hỗ trợ model gián tiếp trong component)

```
/content-manager/relations/{MODEL}/{RELATION_NAME}?filters[{PARENT_RELATION_NAME}][$eq]={PARENT_RELATION_ID}
or
/content-manager/relations/api::author.author/articles?filters[category][$eq]=1
or cho component
/content-manager/relations/page.article-component/articles?filters[category][$eq]=1
```

#### Builder params

Dùng query string builder để nhập bộ lọc vào đường dẫn

Link tại đây: [interactive-query-builder](https://docs.strapi.io/dev-docs/api/rest/interactive-query-builder)

### Selected path

Khi được chọn (có thể nhập trực tiếp hoặc gián tiếp theo cú pháp)

```
/content-manager/relations/{MODEL}/{ID}/{RELATION_NAME}
or
/content-manager/relations/api::author.author/{ID}/articles
```

### Hidden Relation input

Nếu chọn sẽ ẩn theo relation name

### Relation type (yêu cầu)

Relation name chọn 1 hay nhiều

### relation field component Scope

Nếu relation name or parent relation name nằm trong component

### Parent Relation name

#### DYNAMIC ZONE || COMPONENT REPEATABLE (is same)

```
Level 1
{DYNAMIC1}.{INDEX1}.category

Level 2
{DYNAMIC1}.{INDEX1}.{DYNAMIC2}.{INDEX2}.category

or

Level 1
{COMPONENT1}.{INDEX1}.category

Level 2
{COMPONENT1}.{INDEX1}.{COMPONENT2}.{INDEX2}.category
```

#### COMPONENT REPEATABLE with COMPONENT SINGLE

```
Level 2
{COMPONENT1}.{INDEX1}.{COMPONENT2}.category
```

#### COMPONENT SINGLE

```
Level 1
{COMPONENT1}.category

Level 2
{COMPONENT1}.{COMPONENT2}.category
```

#### COMPONENT SINGLE with COMPONENT REPEATABLE

```
Level 2
{COMPONENT1}.{COMPONENT3}.{INDEX1}.category
```

Checked by Regex :`relationName.match(/\w+|\d+/g)`

### Selected path for Parent

Khi parent được chọn (có thể nhập trực tiếp hoặc gián tiếp theo cú pháp)

```
/content-manager/relations/{MODEL}/{ID}/{PARENT_RELATION_NAME}
or
/content-manager/relations/api::author.author/{ID}/category
```
