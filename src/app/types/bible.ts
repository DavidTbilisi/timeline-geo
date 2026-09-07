/** Bible-dataset detail extension: scripture passages shown in the Scriptures tab. */
export interface Scripture {
  reference: string
  verses: { number: number; line: string }[]
}

declare module '@lib/types/detail' {
  interface DetailExtensions {
    scriptures: Scripture[]
  }
}
