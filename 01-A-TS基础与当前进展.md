# 01-A TS基础与当前进展

## 当前目标

本阶段不直接做完整程序，而是先围绕 MyParchment 这个案例学习 TypeScript 和基础软件工程。

当前项目定位：

- 它是一个可调用模块，不只是独立程序
- 暂时不用图形界面
- 暂时用 Console 作为演示壳
- 核心先放在领域建模、模块边界、类型设计

---

## 当前已经确定的产品语义

- 用户可以召唤一本 60 页的草稿本
- 这 60 页是物理页，不是可无限补充的槽位
- 页面内容采用“文本块”结构，不是单一字符串
- 页面有字数限制
- 页面可以被撕下
- 撕下后，页面脱离原草稿本，成为独立散页
- 多张散页可以被回形针别成一个组
- 用户之后可以召回并继续编辑草稿本、散页、以及回形针组

---

## 当前已经学习的 TypeScript 概念

### 1. `type`

`type` 用来给数据结构命名。

例子：

```ts
export type TextBlock = {
  readonly id: string;
  text: string;
};
```

当前理解：

- `TextBlock` 是一种数据结构
- 它描述“文本块长什么样”
- 它不是一个具体对象，而是一类对象的结构说明

工程意义：

- 比匿名对象结构更直观
- 可复用
- 修改集中
- 降低结构不一致的风险

---

### 2. `interface`

`interface` 用来描述“能力边界”。

例子：

```ts
export interface ParchmentService {
  createNotebook(): string;
  getPage(pageId: string): Page | undefined;
  updatePage(pageId: string, blocks: TextBlock[]): void;
}
```

当前理解：

- `ParchmentService` 不描述数据长相
- 它描述模块对外提供什么能力

工程意义：

- 外部调用方只依赖接口
- 内部实现可以替换
- 更适合测试
- 模块边界更清晰

---

### 3. `class`

`class` 用来写具体实现。

例子方向：

```ts
export class InMemoryParchmentService implements ParchmentService {
  // later implementation
}
```

当前理解：

- `ParchmentService` 是约定
- `InMemoryParchmentService` 是具体实现者
- `implements` 表示这个类承诺满足接口要求

工程意义：

- 接口和实现分开
- 同一个接口以后可以有不同实现
- 有利于分层和替换存储方式

---

### 4. `readonly`

`readonly` 用来保护不该被随便修改的字段。

当前已经确认适合只读的例子：

- `id`
- `createdAt`
- `maxCharacterCount`

当前理解：

- 不是所有字段都应该开放修改
- 稳定身份字段应该受保护

工程意义：

- 降低意外修改风险
- 让类型系统帮助维护规则

---

### 5. 数组类型

例子：

```ts
blocks: TextBlock[];
```

意思：

- `blocks` 是一个数组
- 数组里每一项都必须是 `TextBlock`

为什么不用 `string[]`：

- `TextBlock[]` 语义更准确
- 后续可扩展块级 id、排序、属性
- 更适合块级编辑

---

### 6. 联合类型

例子：

```ts
getPage(pageId: string): Page | undefined;
```

意思：

- 可能返回一个 `Page`
- 也可能没找到，返回 `undefined`

工程意义：

- 把“不确定性”写进类型
- 提醒调用方处理失败路径

---

### 7. `import` / `export`

当前理解：

- 一个文件里要使用别的文件导出的内容，就要 `import`
- 一个文件里的类型、接口、类想给别处使用，就要 `export`

工程意义：

- 显式声明依赖
- 保持模块边界清楚
- 避免代码耦在一起

---

## 当前项目中已经创建的文件

### `src/domain/text-block.ts`

用于定义文本块类型。

### `src/domain/page.ts`

用于定义页面类型。

当前 Page 的设计重点：

- `id`
- `blocks`
- `maxCharacterCount`

### `src/application/parchment-service.ts`

用于定义模块对外能力接口。

### `src/application/in-memory-parchment-service.ts`

用于定义第一版内存实现类。

当前还是骨架，尚未进入真正业务实现。

---

## 当前的软件工程认识

### 1. 先定边界，再填实现

先定义：

- 数据模型
- 服务接口
- 目录结构

再写内部逻辑。

这样后面加功能时不容易失控。

### 2. 控制范围，不提前扩展

例如在 `Page` 里提前加入 `title`，虽然不一定错，但当前并未确认。

当前应优先：

- 只写已经确定的模型
- 不提前把未定需求偷偷塞进类型

### 3. 数据模型和服务边界要区分

- `Page`、`TextBlock` 是数据模型
- `ParchmentService` 是服务边界

这两类东西不应混写。

---

## 下一步学习计划

下一步将继续围绕 `InMemoryParchmentService` 学习：

- `private`
- 类字段
- `Map`
- 最小可运行的内存状态

目标不是一次写完整业务，而是继续边学 TypeScript，边把项目骨架变成一个最小可工作的模块。
