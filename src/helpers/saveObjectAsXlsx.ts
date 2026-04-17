import { saveAs } from 'file-saver'
import type { Patient } from 'types/Patient'
import constructCsv from './constructCsv'

const fileExtension = '.xlsx'
export const sheetName = 'visits'
export const photosSheetName = 'photos_data'

function getPhotoColumnIndex(data: Patient) {
  const fieldIndex =
    data.visits[0]?.fields.findIndex((field) => field.key === 'photo') ?? -1
  if (fieldIndex < 0) return null

  return data.passport.length + 2 + fieldIndex + 1
}

function getImageExtension(dataUrl: string) {
  if (dataUrl.startsWith('data:image/png')) return 'png'

  return 'jpeg'
}

export default async function saveObjectAsXlsx(
  fileName: string,
  data: Patient
) {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  const photosWorksheet = workbook.addWorksheet(photosSheetName)
  const { titles, rows } = constructCsv(data)
  const photoColumnIndex = getPhotoColumnIndex(data)

  worksheet.addRow(titles)
  for (const row of rows) {
    worksheet.addRow(row)
  }

  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  worksheet.columns = titles.map((title, index) => ({
    header: title,
    width: index + 1 === photoColumnIndex ? 24 : 20,
  }))

  if (photoColumnIndex !== null) {
    data.visits.forEach((visit, index) => {
      const photoField = visit.fields.find((field) => field.key === 'photo')
      if (typeof photoField?.value !== 'string' || !photoField.value) return

      const rowNumber = index + 2
      const imageId = workbook.addImage({
        base64: photoField.value,
        extension: getImageExtension(photoField.value),
      })

      worksheet.getRow(rowNumber).height = 135
      worksheet.addImage(imageId, {
        tl: { col: photoColumnIndex - 1 + 0.05, row: rowNumber - 1 + 0.05 },
        ext: { width: 170, height: 170 },
      })
    })
  }

  photosWorksheet.addRow(['visitNumber', 'photo'])
  for (const visit of data.visits) {
    const photoField = visit.fields.find((field) => field.key === 'photo')
    if (typeof photoField?.value !== 'string' || !photoField.value) continue

    photosWorksheet.addRow([visit.visitNumber, photoField.value])
  }
  photosWorksheet.state = 'veryHidden'

  const excelBuffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  saveAs(blob, fileName + fileExtension, { autoBom: true })
}
