import { useState } from 'react';
// Using emoji icons to avoid lucide-react import issues

interface ColumnConfig {
    id: string;
    title: string;
    type: string;  // Flexible: 'text', 'number', 'date', 'checkbox' or any custom type
}

interface SpreadsheetPreviewTableProps {
    columns: ColumnConfig[];
    rows: Array<Record<string, any>>;
    source?: string;
    onApply: (rows: Array<Record<string, any>>, columns: ColumnConfig[]) => void;
    onCancel: () => void;
}

export function SpreadsheetPreviewTable({
    columns,
    rows: initialRows,
    source = 'Vizta',
    onApply,
    onCancel
}: SpreadsheetPreviewTableProps) {
    const [editableRows, setEditableRows] = useState(initialRows);

    const handleCellEdit = (rowIndex: number, columnId: string, value: any) => {
        const newRows = [...editableRows];
        newRows[rowIndex] = { ...newRows[rowIndex], [columnId]: value };
        setEditableRows(newRows);
    };

    const renderCell = (row: Record<string, any>, column: ColumnConfig, rowIndex: number) => {
        const value = row[column.id];

        if (column.type === 'checkbox') {
            return (
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => handleCellEdit(rowIndex, column.id, e.target.checked)}
                    className="rounded border-gray-300 text-purple-600"
                />
            );
        }

        return (
            <input
                type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                value={value || ''}
                onChange={(e) => handleCellEdit(rowIndex, column.id, e.target.value)}
                className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none rounded"
            />
        );
    };

    return (
        <div className="my-4 border border-purple-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Header */}
            <div className="bg-purple-50 p-3 border-b border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <div>
                        <h3 className="font-semibold text-gray-900">Vista Previa de Datos</h3>
                        <p className="text-xs text-gray-600">
                            {editableRows.length} filas • Fuente: {source}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-lg"
                >
                    ✕
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.id}
                                    className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                >
                                    {col.title}
                                    <span className="ml-1 text-gray-400 font-normal lowercase">
                                        ({col.type})
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {editableRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                                {columns.map((col) => (
                                    <td key={col.id} className="px-4 py-2">
                                        {renderCell(row, col, rowIndex)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 p-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Los datos se agregarán al Spreadsheet interno. Puedes editarlos antes de aplicar.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onApply(editableRows, columns)}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                        ✓ Aplicar a Spreadsheet
                    </button>
                </div>
            </div>
        </div>
    );
}
