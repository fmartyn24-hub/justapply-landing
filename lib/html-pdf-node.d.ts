declare module 'html-pdf-node' {
  export interface PdfOptions {
    format?: string
    margin?: {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
    printBackground?: boolean
    args?: string[]
    [key: string]: any
  }

  export interface HtmlFile {
    content?: string
    url?: string
  }

  export function generatePdf(file: HtmlFile, options: PdfOptions, callback?: any): Promise<Buffer>
  export function generatePdfs(files: HtmlFile[], options: PdfOptions, callback?: any): Promise<Buffer[]>
}
