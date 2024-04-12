# react-location-code

English | [简体中文](./README_CN.md)

Quickly helps developers locate the source code position of any element on a page and its file dependencies.

Usage

```shell
npm install react-location-code
```

```javascript
import initLocation from 'react-location-code'

initLocation()
```

![2621712842768_.pic.jpg](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/89a7ce4fd0204c59857224a4c470ed3a~tplv-k3u1fbpfcp-jj-mark:3024:0:0:0:q75.awebp#?w=1220&h=816&s=72476&e=png&b=f3f3f3)

#### TODO

- ts 重构
  - 构建流程
  - class 结构 上下文都不好拿 全依赖传参
  - monorepo 项目 TDD 可能有多个？
  - chrome 插件
- 开发 示例 TDD
