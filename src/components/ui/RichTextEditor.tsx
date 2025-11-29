import React, { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import TiptapUnderline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Button } from './button'
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Link as LinkIcon,
    Image as ImageIcon,
    Table as TableIcon,
    Highlighter,
    Maximize,
    Minimize,
    Save,
    Download
} from 'lucide-react';
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// @ts-ignore - html-docx-js loaded via CDN
// import { asBlob } from 'html-docx-js/dist/html-docx'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    onSave?: () => void
    onExportPDF?: () => void
    onExportWord?: () => void
    placeholder?: string
    isFullscreen?: boolean
    onToggleFullscreen?: () => void
    autoSave?: boolean
    autoSaveInterval?: number
    title?: string
}

const MenuBar = ({ editor, isFullscreen, onToggleFullscreen, onSave, onExportPDF, onExportWord }: any) => {
    if (!editor) {
        return null
    }

    const addImage = () => {
        const url = window.prompt('URL de la imagen:')
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL del enlace:', previousUrl)

        if (url === null) {
            return
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    const addTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }

    const buttonClass = (isActive?: boolean) =>
        `p-2 rounded hover:bg-slate-200 transition-colors ${isActive ? 'bg-slate-300 text-blue-600' : 'text-slate-700'
        }`

    return (
        <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="flex flex-wrap gap-1 p-2">
                {/* Text Formatting */}
                <div className="flex gap-1 border-r border-slate-200 pr-2">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={buttonClass(editor.isActive('bold'))}
                        title="Negrita (Ctrl+B)"
                    >
                        <Bold className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={buttonClass(editor.isActive('italic'))}
                        title="Cursiva (Ctrl+I)"
                    >
                        <Italic className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={buttonClass(editor.isActive('underline'))}
                        title="Subrayado (Ctrl+U)"
                    >
                        <Underline className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={buttonClass(editor.isActive('strike'))}
                        title="Tachado"
                    >
                        <Strikethrough className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        className={buttonClass(editor.isActive('code'))}
                        title="Código"
                    >
                        <Code className="h-4 w-4" />
                    </button>
                </div>

                {/* Headings */}
                <div className="flex gap-1 border-r border-slate-200 pr-2">
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={buttonClass(editor.isActive('heading', { level: 1 }))}
                        title="Título 1"
                    >
                        <Heading1 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={buttonClass(editor.isActive('heading', { level: 2 }))}
                        title="Título 2"
                    >
                        <Heading2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={buttonClass(editor.isActive('heading', { level: 3 }))}
                        title="Título 3"
                    >
                        <Heading3 className="h-4 w-4" />
                    </button>
                </div>

                {/* Lists */}
                <div className="flex gap-1 border-r border-slate-200 pr-2">
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={buttonClass(editor.isActive('bulletList'))}
                        title="Lista con viñetas"
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={buttonClass(editor.isActive('orderedList'))}
                        title="Lista numerada"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={buttonClass(editor.isActive('blockquote'))}
                        title="Cita"
                    >
                        <Quote className="h-4 w-4" />
                    </button>
                </div>

                {/* Alignment */}
                <div className="flex gap-1 border-r border-slate-200 pr-2">
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={buttonClass(editor.isActive({ textAlign: 'left' }))}
                        title="Alinear izquierda"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={buttonClass(editor.isActive({ textAlign: 'center' }))}
                        title="Centrar"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={buttonClass(editor.isActive({ textAlign: 'right' }))}
                        title="Alinear derecha"
                    >
                        <AlignRight className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        className={buttonClass(editor.isActive({ textAlign: 'justify' }))}
                        title="Justificar"
                    >
                        <AlignJustify className="h-4 w-4" />
                    </button>
                </div>

                {/* Insert */}
                <div className="flex gap-1 border-r border-slate-200 pr-2">
                    <button onClick={setLink} className={buttonClass(editor.isActive('link'))} title="Insertar enlace">
                        <LinkIcon className="h-4 w-4" />
                    </button>
                    <button onClick={addImage} className={buttonClass()} title="Insertar imagen">
                        <ImageIcon className="h-4 w-4" />
                    </button>
                    <button onClick={addTable} className={buttonClass()} title="Insertar tabla">
                        <TableIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Colors */}
                <div className="flex gap-1 border-r border-slate-200 pr-2">
                    <input
                        type="color"
                        onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        className="w-8 h-8 rounded cursor-pointer"
                        title="Color de texto"
                    />
                    <button
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={buttonClass(editor.isActive('highlight'))}
                        title="Resaltar"
                    >
                        <Highlighter className="h-4 w-4" />
                    </button>
                </div>

                {/* Undo/Redo */}
                <div className="flex gap-1 border-r border-slate-200 pr-2">
                    <button
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className={buttonClass()}
                        title="Deshacer (Ctrl+Z)"
                    >
                        <Undo className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className={buttonClass()}
                        title="Rehacer (Ctrl+Y)"
                    >
                        <Redo className="h-4 w-4" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-1 ml-auto">
                    {onSave && (
                        <Button onClick={onSave} variant="ghost" size="sm" className="gap-2" title="Guardar (Ctrl+S)">
                            <Save className="h-4 w-4" />
                            <span className="hidden sm:inline">Guardar</span>
                        </Button>
                    )}
                    {onExportPDF && (
                        <Button onClick={onExportPDF} variant="ghost" size="sm" className="gap-2" title="Exportar a PDF">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">PDF</span>
                        </Button>
                    )}
                    {onExportWord && (
                        <Button onClick={onExportWord} variant="ghost" size="sm" className="gap-2" title="Exportar a Word">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Word</span>
                        </Button>
                    )}
                    {onToggleFullscreen && (
                        <button onClick={onToggleFullscreen} className={buttonClass()} title="Pantalla completa (F11)">
                            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    onSave,
    onExportPDF,
    onExportWord,
    placeholder = 'Comienza a escribir tu documento...',
    isFullscreen = false,
    onToggleFullscreen,
    autoSave = false,
    autoSaveInterval = 30000,
    title = 'Documento',
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TiptapUnderline,
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[500px] p-4',
            },
        },
    })

    // Auto-save functionality
    useEffect(() => {
        if (!autoSave || !onSave || !editor) return

        const interval = setInterval(() => {
            onSave()
        }, autoSaveInterval)

        return () => clearInterval(interval)
    }, [autoSave, onSave, autoSaveInterval, editor])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                onSave?.()
            }
            if (e.key === 'F11') {
                e.preventDefault()
                onToggleFullscreen?.()
            }
            if (e.key === 'Escape' && isFullscreen) {
                onToggleFullscreen?.()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onSave, onToggleFullscreen, isFullscreen])

    // Export to PDF
    const handleExportPDF = useCallback(async () => {
        if (!editor) return

        const element = document.querySelector('.ProseMirror') as HTMLElement
        if (!element) return

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        })

        const imgWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
        }

        pdf.save(`${title}.pdf`)
        onExportPDF?.()
    }, [editor, title, onExportPDF])

    // Export to Word
    const handleExportWord = useCallback(async () => {
        if (!editor) return

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 2cm; }
            h1 { font-size: 24pt; margin-top: 0; }
            h2 { font-size: 18pt; }
            h3 { font-size: 14pt; }
            p { margin: 0.5em 0; }
            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>
          ${editor.getHTML()}
        </body>
      </html>
    `

        // @ts-ignore
        const blob = await (window as any).htmlDocx.asBlob(html)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${title}.docx`
        link.click()
        URL.revokeObjectURL(url)
        onExportWord?.()
    }, [editor, title, onExportWord])

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
            <MenuBar
                editor={editor}
                isFullscreen={isFullscreen}
                onToggleFullscreen={onToggleFullscreen}
                onSave={onSave}
                onExportPDF={handleExportPDF}
                onExportWord={handleExportWord}
            />
            <div className={`overflow-y-auto ${isFullscreen ? 'h-[calc(100vh-60px)]' : 'max-h-[600px]'} bg-slate-50`}>
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}

export default RichTextEditor
