declare module 'html-pdf-node' {
  export interface ConvertOptions {
    format?: string
    margin?: {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
    printBackground?: boolean
    [key: string]: any
  }

  export interface HtmlFile {
    content: string
  }

  export function convertHtmlString(file: HtmlFile, options: ConvertOptions): Promise<Buffer>
}
