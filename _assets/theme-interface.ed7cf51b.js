import { c as createElement } from './clientRender.c35fda0c.js';

const layoutProps = {};
const MDXLayout = "wrapper";
function MDXContent({
  components,
  ...props
}) {
  return /* @__PURE__ */ createElement(MDXLayout, {
    ...layoutProps,
    ...props,
    components,
    mdxType: "MDXLayout"
  }, /* @__PURE__ */ createElement("pre", null, /* @__PURE__ */ createElement("code", {
    parentName: "pre",
    ...{
      className: "language-ts"
    }
  }, `/**
 * @param pages all pages' static data.
 */
type ICreateTheme = (pages: IPages) => ITheme

interface IPages {
  [path: string]: {
    staticData: any
  }
}

interface ITheme {
  /**
   * loading the first page's data, render the initial loading state.
   * if the app is build with ssr,
   * vite-pages will not use it to render the initial loading state.
   *
   * @param pageStaticData current page's static data.
   */
  initialLoading?: (pageStaticData: any) => React.ReactElement | null
  /**
   * current page's data is ready, render the page content.
   *
   * @param pageData current page's data. including static data and runtime data. It may contain data from multiple files if this is a composed page.
   */
  loaded: (pageData: IPageLoaded) => React.ReactElement | null
  /**
   * app is loading another page, render the transition loading state.
   * if transitionLoading is not provided, vite-pages will fallback to initialLoading.
   *
   * @param pageStaticData current page's static data.
   * @param prevPageData previous page's data.
   */
  transitionLoading?: (
    pageStaticData: any,
    prevPageData: IPageLoaded
  ) => React.ReactElement | null
  /**
   * If error happens while loading,
   * vite-pages will use it to render the error state.
   *
   * @param error the error.
   * @param pageStaticData current page's static data.
   */
  loadError?: (error: any, pageStaticData: any) => React.ReactElement | null
  /**
   * If no page match the current url,
   * vite-pages will use it to render the view.
   * You can render 404 page with it,
   * or redirect to home page with it,
   * or render more routes (define more pages).
   *
   * @param renderPage theme can use it to render a page.
   */
  noPageMatch?: (renderPage: IRenderPage) => React.ReactElement | null
}
`)));
}
MDXContent.isMDXComponent = true;

export { MDXContent as M };