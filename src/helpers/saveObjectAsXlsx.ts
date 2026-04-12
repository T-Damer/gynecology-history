import { saveAs } from 'file-saver'
import type { Patient } from 'types/Patient'
import { type WorkBook, utils, write } from 'xlsx'
import constructCsv from './constructCsv'

const fileExtension = '.xlsx'
export const sheetName = 'visits'

function createXlsxBlob(data: Patient) {
  const { titles, rows } = constructCsv(data)
  const workSheet = utils.aoa_to_sheet([titles, ...rows])
  const workBook: WorkBook = {
    Sheets: { [sheetName]: workSheet },
    SheetNames: [sheetName],
  }
  const excelBuffer = write(workBook, { bookType: 'xlsx', type: 'array' })
  return { blob: new Blob([excelBuffer]) }
}

export default function (fileName: string, data: Patient) {
  const { blob } = createXlsxBlob(data)

  saveAs(blob, fileName + fileExtension, { autoBom: true })
}
