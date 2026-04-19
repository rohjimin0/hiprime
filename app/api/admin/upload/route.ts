import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 })
  }

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

  const filename = `${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
