"use client"

import { useState, useEffect, useCallback } from "react"
import "../types/google.d.ts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/Badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Folder from 'lucide-react/dist/esm/icons/folder';
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import FolderPlus from 'lucide-react/dist/esm/icons/folder-plus';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import Video from 'lucide-react/dist/esm/icons/video';
import Link from 'lucide-react/dist/esm/icons/link';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Filter from 'lucide-react/dist/esm/icons/filter';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Download from 'lucide-react/dist/esm/icons/download';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Archive from 'lucide-react/dist/esm/icons/archive';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Cloud from 'lucide-react/dist/esm/icons/cloud';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Users from 'lucide-react/dist/esm/icons/users';
import StickyNote from 'lucide-react/dist/esm/icons/sticky-note';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "../context/AuthContext"
import { useGoogleDrive } from "../hooks/useGoogleDrive"
import {
  supabase,
  getCodexItemsByUser,
  createCodexBucket,
  getUserProjects,
  Project,
  createCodexGroup,
  addItemToGroup,
  removeItemFromGroup,
  getGroupItems,
  getGroupStats,
  deleteGroup,
  updateGroupInfo,
  getUserGroups,
} from "../services/supabase.ts"
// URL dinámico del backend ExtractorW
import { EXTRACTORW_API_URL } from "../services/api";
import Search from 'lucide-react/dist/esm/icons/search';
import Checkbox from "@mui/material/Checkbox";

// Iconos temporales que pueden recibir props
// (bloque eliminado - ahora se usan directamente los íconos de lucide-react)

interface CodexItem {
  id: string
  user_id: string
  tipo: string
  titulo: string
  descripcion?: string
  etiquetas: string[]
  proyecto: string
  project_id?: string
  storage_path?: string
  url?: string
  nombre_archivo?: string
  tamano?: number
  fecha: string
  created_at: string
  is_drive?: boolean
  drive_file_id?: string
  audio_transcription?: string // NUEVO: transcripción guardada en la BD
  // NUEVO: Campos para agrupamiento
  group_id?: string
  is_group_parent?: boolean
  group_name?: string
  group_description?: string
  part_number?: number
  total_parts?: number
}

interface CodexStats {
  documentos: number
  audios: number
  videos: number
  enlaces: number
  notas: number
}

// NUEVO: Componente para renderizar carpetas/grupos
interface FolderCardProps {
  item: CodexItem;
  onEdit: (item: CodexItem) => void;
  onDelete: (groupId: string) => void;
  onAddItem: (group: CodexItem) => void;
  onViewItem: (item: CodexItem) => void;
  onDownloadItem: (item: CodexItem) => void;
  onTranscribeItem: (item: CodexItem) => void;
  onShowTranscription: (item: CodexItem) => void;
  onEditItem: (item: CodexItem) => void;
  // selección
  selectionMode: boolean;
  selectedIds: string[];
  toggleSelectItem: (id: string) => void;
}

const CodexFolderCard: React.FC<FolderCardProps> = ({
  item,
  onEdit,
  onDelete,
  onAddItem,
  onViewItem,
  onDownloadItem,
  onTranscribeItem,
  onShowTranscription,
  onEditItem,
  selectionMode,
  selectedIds,
  toggleSelectItem
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<CodexItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ count: 0, size: 0 });

  const getTypeIcon = (type: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
      documento: FileText,
      audio: Headphones,
      video: Video,
      enlace: Link,
      nota: StickyNote,
      default: FileText,
    };
    return iconMap[type] || iconMap.default;
  };
  
  const groupUuid = item.group_id || item.id

  const fetchGroupData = async () => {
    if (!groupUuid) return;
    setIsLoading(true);
    try {
      const [groupItems, groupStats] = await Promise.all([
        getGroupItems(groupUuid, item.user_id),
        getGroupStats(groupUuid)
      ]);
      setChildren(groupItems);
      const fallbackCount = groupItems.length;
      const fallbackSize = groupItems.reduce((acc, curr) => acc + (curr.tamano || 0), 0);
      setStats({ 
        count: (groupStats?.item_count ?? 0) > 0 ? groupStats.item_count : fallbackCount, 
        size: (groupStats?.total_size ?? 0) > 0 ? groupStats.total_size : fallbackSize 
      });
    } catch (error) {
      console.error("Error fetching group data:", error);
      setStats({ count: 0, size: 0 });
    }
    setIsLoading(false);
  };

  const toggleExpansion = () => {
    const newExpansionState = !isExpanded;
    setIsExpanded(newExpansionState);
    if (newExpansionState && children.length === 0) {
      fetchGroupData();
    }
  };
  
  useEffect(() => {
    if (!groupUuid) return;
    (async () => {
      try {
        const gs = await getGroupStats(groupUuid);
        if (gs && gs.item_count !== undefined) {
          setStats({ count: gs.item_count, size: gs.total_size });
        } else {
          const items = await getGroupItems(groupUuid, item.user_id);
          setStats({ count: items.length, size: items.reduce((acc, curr)=>acc+(curr.tamano||0),0) });
        }
      } catch (error) {
        console.error("Error loading group stats:", error);
      }
    })();
  }, [groupUuid])

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const canTranscribe = (item: CodexItem) => {
    const supportedAudio = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'];
    const supportedVideo = ['mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v'];
    const extension = item.nombre_archivo?.split('.').pop()?.toLowerCase() || '';
    return item.tipo === 'audio' || item.tipo === 'video' 
      ? [...supportedAudio, ...supportedVideo].includes(extension)
      : false;
  };


  return (
    <Card className="relative bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden w-full col-span-1 lg:col-span-2 xl:col-span-3">
      {selectionMode && (
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onChange={() => toggleSelectItem(item.id)}
          className="absolute top-2 left-2 z-20 bg-white rounded"
        />
      )}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={toggleExpansion}>
            <Folder className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-slate-800">{item.group_name || "Grupo sin nombre"}</CardTitle>
              <CardDescription className="text-sm text-slate-500 mt-1">{item.group_description || "Sin descripción."}</CardDescription>
            </div>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <Badge variant="secondary" className="hidden sm:inline-flex">{stats.count} elementos</Badge>
          <Badge variant="secondary" className="hidden md:inline-flex">{formatFileSize(stats.size)}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddItem(item)}><FolderPlus className="h-4 w-4 mr-2" />Añadir a este grupo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)}><Edit className="h-4 w-4 mr-2" />Editar grupo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Eliminar grupo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggleExpansion}>
            {isExpanded ? <ChevronUp className="h-6 w-6 text-slate-600" /> : <ChevronDown className="h-6 w-6 text-slate-600" />}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <CardContent className="p-4 bg-slate-25">
          {isLoading ? <p className="text-center p-4 text-slate-500">Cargando elementos...</p> : (
            <div className="space-y-2">
              {children.length > 0 ? children.map(child => {
                const IconComponent = getTypeIcon(child.tipo);
                const hasTranscription = !!(child.audio_transcription || (child as any).transcription);
                return (
                  <div key={child.id} className="flex items-center justify-between p-2 pl-4 rounded-md bg-white hover:bg-slate-100 border border-slate-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <IconComponent className="h-5 w-5 text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-700 truncate block" title={child.titulo}>{child.titulo}</span>
                        {hasTranscription && (
                          <span className="text-xs text-green-600 cursor-pointer hover:underline" onClick={() => onShowTranscription(child)} title="Tiene transcripción - click para ver">
                            Transcripción disponible
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasTranscription && <Button variant="ghost" size="icon" onClick={() => onShowTranscription(child)} title="Ver Transcripción" className="text-green-600"><Mic className="h-4 w-4"/></Button>}
                      {canTranscribe(child) && !child.audio_transcription && <Button variant="ghost" size="icon" onClick={() => onTranscribeItem(child)} title="Transcribir"><Mic className="h-4 w-4"/></Button>}
                      {child.storage_path && <Button variant="ghost" size="icon" onClick={() => onDownloadItem(child)} title="Descargar"><Download className="h-4 w-4"/></Button>}
                      <Button variant="ghost" size="icon" onClick={() => onViewItem(child)} title="Ver Detalles"><Eye className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" onClick={() => onEditItem(child)} title="Editar"><Edit className="h-4 w-4"/></Button>
                    </div>
                  </div>
                )
              }) : <p className="text-center p-4 text-slate-500 text-sm">Este grupo está vacío.</p>}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default function EnhancedCodex() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [showAllItems, setShowAllItems] = useState(false)
  const [itemsToShow, setItemsToShow] = useState(6)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [codexItems, setCodexItems] = useState<CodexItem[]>([])
  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<CodexStats>({
    documentos: 0,
    audios: 0,
    videos: 0,
    enlaces: 0,
    notas: 0
  })
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Optional metadata toggle states
  const [showUploadMetadata, setShowUploadMetadata] = useState(false)
  const [showDriveMetadata, setShowDriveMetadata] = useState(false)
  const [showNoteMetadata, setShowNoteMetadata] = useState(false)
  
  // Form states
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [noteTags, setNoteTags] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  
  // New content type field for all options
  const [contentType, setContentType] = useState("")
  
  // Relations for notes
  const [selectedRelatedItems, setSelectedRelatedItems] = useState<string[]>([])
  const [showRelationSelector, setShowRelationSelector] = useState(false)
  
  // Additional form states for upload and drive
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadTags, setUploadTags] = useState("")
  const [uploadProject, setUploadProject] = useState("")
  const [isPartOfSeries, setIsPartOfSeries] = useState(false)
  
  const [driveTitle, setDriveTitle] = useState("")
  const [driveDescription, setDriveDescription] = useState("")
  const [driveTags, setDriveTags] = useState("")
  const [driveProject, setDriveProject] = useState("")
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  
  // Google Drive states
  const [isDriveConnected, setIsDriveConnected] = useState(false)
  const [driveFiles, setDriveFiles] = useState<any[]>([])
  const [selectedDriveFile, setSelectedDriveFile] = useState<any>(null)
  
  // Estados para edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CodexItem | null>(null)
  const [editForm, setEditForm] = useState({
    titulo: '',
    descripcion: '',
    etiquetas: '',
    proyecto: ''
  })
  
  // Estados para transcripción
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)
  const [transcriptionModalItem, setTranscriptionModalItem] = useState<CodexItem | null>(null)
  
  // Estados para el sistema de agrupamiento
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [groupForm, setGroupForm] = useState({
    group_name: '',
    group_description: '',
    parent_item_id: ''
  })
  const [selectedItemForGroup, setSelectedItemForGroup] = useState<CodexItem | null>(null)
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false)
  const [availableGroups, setAvailableGroups] = useState<CodexItem[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [partNumber, setPartNumber] = useState(1)
  const [showGroupDetails, setShowGroupDetails] = useState<string | null>(null)
  
  // Estados para enlaces múltiples
  const [linksInput, setLinksInput] = useState("")
  const [detectedLinks, setDetectedLinks] = useState<string[]>([])
  const [linkTitle, setLinkTitle] = useState("")
  const [linkDescription, setLinkDescription] = useState("")
  const [linkTags, setLinkTags] = useState("")
  const [linkProject, setLinkProject] = useState("")
  const [shouldAnalyzeLinks, setShouldAnalyzeLinks] = useState(false)
  const [showLinkMetadata, setShowLinkMetadata] = useState(false)

  // Estados para análisis automático de enlaces
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false)
  
  // Estados para el modal de edición de grupo
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false)
  const [groupToEdit, setGroupToEdit] = useState<CodexItem | null>(null)
  
  // NUEVO: Estado para los items que se mostrarán en el nivel superior (grupos y archivos no agrupados)
  const [topLevelItems, setTopLevelItems] = useState<CodexItem[]>([])
  
  const { user, session } = useAuth()
  const [googleDriveToken, setGoogleDriveToken] = useState<string | null>(null)
  const [pickerReady, setPickerReady] = useState(false)
  
  // Import del hook useGoogleDrive para mejorar UX
  const { 
    isGoogleUser, 
    token: driveToken, 
    loading: driveLoading, 
    error: driveError, 
    openPicker, 
    autoOpenPickerIfTokenExists,
    hasValidToken,
    canUseDrive 
  } = useGoogleDrive()

  // ------------------------------
  // Feature flags
  // ------------------------------
  const DRIVE_ENABLED = false; // 🚫 Deshabilitado temporalmente subir desde Google Drive
  const NOTE_ENABLED = true; // función notas activada
  const RELATIONS_ENABLED = false; // 🚫 deshabilitar relacionar notas con archivos

  // 1. Agrega de nuevo el estado shouldGenerateDescription
  const [shouldGenerateDescription, setShouldGenerateDescription] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Handler to toggle selection of an item
  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Delete selected items
  const handleDeleteSelectedItems = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedIds.length} elemento(s) seleccionados?`)) return;
    try {
      await supabase.from('codex_items').delete().in('id', selectedIds);
      setSelectedIds([]);
      setSelectionMode(false);
      await loadCodexData(); // recargar
    } catch (err) {
      console.error('Error eliminando seleccionados', err);
      alert('Error eliminando elementos seleccionados');
    }
  };

  // Delete all user items
  const handleDeleteAllItems = async () => {
    if (!window.confirm('¿Estás seguro de eliminar TODOS tus elementos del Codex? Esta acción es irreversible.')) return;
    try {
      await supabase.from('codex_items').delete().eq('user_id', user?.id);
      setSelectedIds([]);
      setSelectionMode(false);
      await loadCodexData();
    } catch (err) {
      console.error('Error eliminando todos', err);
      alert('Error eliminando todos los elementos');
    }
  };

  /**
   * Asegura que tenemos un token válido de Google Drive.
   * Si ya lo tenemos, lo devuelve inmediatamente.
   * En caso contrario lanza el flujo de consentimiento y resuelve
   * la promesa cuando el usuario concede acceso y se recibe el token.
   */
  const ensureDriveToken = useCallback(async (): Promise<string> => {
    if (googleDriveToken) return googleDriveToken

    return new Promise((resolve, reject) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        reject(new Error('Google Drive no está configurado correctamente. Falta CLIENT_ID'))
        return
      }

      const tokenClient = window.google?.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        prompt: 'consent', // Siempre mostrar popup
        callback: (resp: any) => {
          if (resp.error || !resp.access_token) {
            reject(new Error(resp.error || 'No se pudo obtener token de Google Drive'))
            return
          }
          setGoogleDriveToken(resp.access_token)
          resolve(resp.access_token)
        }
      })

      if (tokenClient) {
        tokenClient.requestAccessToken()
      } else {
        reject(new Error('No se pudo inicializar Google Identity Services'))
      }
    })
  }, [googleDriveToken])

  // --------------------------------------------------
  // GOOGLE DRIVE: load GIS + Picker scripts once
  // --------------------------------------------------
  useEffect(() => {
    // Load Google Identity Services
    if (!window.google) {
      const gsiScript = document.createElement('script')
      gsiScript.src = 'https://accounts.google.com/gsi/client'
      gsiScript.async = true
      gsiScript.defer = true
      document.body.appendChild(gsiScript)
    }

    // Load GAPI + Picker
    if (!window.gapi) {
      const gapiScript = document.createElement('script')
      gapiScript.src = 'https://apis.google.com/js/api.js'
      gapiScript.onload = () => {
        window.gapi.load('picker', {
          callback: () => {
            if (window.google?.picker) {
              setPickerReady(true)
            }
          },
        })
      }
      document.body.appendChild(gapiScript)
    } else {
      window.gapi.load('picker', {
        callback: () => {
          if (window.google?.picker) setPickerReady(true)
        }
      })
    }
  }, [])

  // --------------------------------------------------
  // Handler: Connect Google Drive (opens consent + picker)
  // --------------------------------------------------
  const handleGoogleDriveAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const apiKey   = import.meta.env.VITE_GOOGLE_API_KEY
    if (!clientId || !apiKey) {
      setError('Google Drive no está configurado correctamente.')
      return
    }

    // If token already present, solo abrir picker
    if (googleDriveToken) {
      if (pickerReady) {
        openGooglePicker(googleDriveToken)
      } else {
        // wait until picker ready then open
        const interval = setInterval(() => {
          if (window.gapi?.picker) {
            clearInterval(interval)
            setPickerReady(true)
            openGooglePicker(googleDriveToken)
          }
        }, 300)
      }
      return
    }

    // Crear token client (popup)
    const tokenClient = window.google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      prompt: 'consent',
      callback: (response: any) => {
        if (response.error) {
          console.error('Token error:', response.error)
          setError('Error al obtener token de Google Drive')
          return
        }
        setGoogleDriveToken(response.access_token)
        setIsDriveConnected(true)
        if (pickerReady) {
          openGooglePicker(response.access_token)
        } else {
          const waitP = setInterval(() => {
            if (window.gapi?.picker) {
              clearInterval(waitP)
              setPickerReady(true)
              openGooglePicker(response.access_token)
            }
          }, 300)
        }
      }
    })

    if (tokenClient) {
      tokenClient.requestAccessToken()
    } else {
      setError('No se pudo inicializar Google Identity Services')
    }
  }

  // --------------------------------------------------
  // Open Google Picker so user selects file(s)
  // --------------------------------------------------
  const openGooglePicker = (accessToken: string) => {
    if (!window.gapi?.picker) {
      if (!window.google?.picker) {
        setError('Google Picker no está disponible aún. Intenta de nuevo.')
        return
      }
    }

    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.DOCS)
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
      .setOAuthToken(accessToken)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0]
          const consent = window.confirm(
            'Para procesar este archivo necesitamos crear una copia temporal en tu Google Drive que pertenecerá a la aplicación. ¿Deseas continuar?'
          )
          if (!consent) {
            console.log('Usuario canceló la copia del archivo');
            return
          }

          const pickedFile = {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.sizeBytes || 0,
            webViewLink: file.url,
            thumbnailLink: file.iconUrl
          }
          setSelectedDriveFile(pickedFile)
          setDriveTitle(file.name)
          setDriveFiles([pickedFile])

          // Guardar automáticamente el archivo en el Codex tras el consentimiento
          setTimeout(() => {
            handleSaveDriveFile(pickedFile);
          }, 0);
        }
      })
      .build()

    picker.setVisible(true)
  }

  // --------------------------------------------------
  // Handle Drive File Selection
  // --------------------------------------------------
  const handleDriveFileSelect = (file: any) => {
    setSelectedDriveFile(file)
  }

  // Cargar datos del Codex cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      loadCodexData()
      loadUserProjects()
      // Initialize Supabase bucket for file storage
      createCodexBucket()
    }
  }, [user])

  const loadCodexData = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const items = await getCodexItemsByUser(user.id)
      setCodexItems(items)
      calculateStats(items)
    } catch (err) {
      console.error('Error loading codex data:', err)
      setError('Error al cargar los datos del Codex')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProjects = async () => {
    if (!user?.id) return
    
    try {
      const projects = await getUserProjects()
      setUserProjects(projects)
    } catch (err) {
      console.error('Error loading user projects:', err)
    }
  }

  // Función auxiliar para obtener el path de almacenamiento basado en el proyecto
  const getStoragePath = (projectId: string, fileName: string) => {
    if (!projectId || projectId === 'sin-proyecto') {
      return `${user?.id}/${fileName}`
    }
    
    const project = userProjects.find(p => p.id === projectId)
    const projectFolder = project ? project.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'proyecto_sin_nombre'
    return `${user?.id}/proyectos/${projectFolder}/${fileName}`
  }

  const calculateStats = (items: CodexItem[]) => {
    const newStats = {
      documentos: items.filter(item => item.tipo === 'documento').length,
      audios: items.filter(item => item.tipo === 'audio').length,
      videos: items.filter(item => item.tipo === 'video').length,
      enlaces: items.filter(item => item.tipo === 'enlace').length,
      notas: items.filter(item => item.tipo === 'nota').length
    }
    setStats(newStats)
  }

  // Función para generar descripción con Gemini
  const generateDescriptionWithAI = async (url: string) => {
    if (!user?.id || !session?.access_token) return null

    try {
      console.log('🤖 Generando descripción con IA para:', url)
      
      const response = await fetch(`${EXTRACTORW_API_URL}/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          url: url,
          type: 'tweet_description'
        })
      })

      if (!response.ok) {
        console.error(`❌ Error generando descripción: ${response.status}`)
        return null
      }

      const result = await response.json()
      console.log('✅ Descripción generada:', result)
      return result.description || null

    } catch (err) {
      console.error('❌ Error en generación de descripción:', err)
      return null
    }
  }

  // Función para ejecutar análisis automático en segundo plano
  const executeAutoAnalysis = async (itemIds: string[], shouldGenerateDescription: boolean) => {
    if (!user?.id || !session?.access_token || itemIds.length === 0) return

    setIsAutoAnalyzing(true)

    try {
      console.log('🔍 Ejecutando análisis automático de enlaces de X...')
      
      const response = await fetch(`${EXTRACTORW_API_URL}/pending-analysis/analyze-pending-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          itemIds: itemIds,
          processAll: false,
          dryRun: false,
          shouldGenerateDescription: shouldGenerateDescription
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error(`❌ Error en análisis automático: ${response.status}: ${errorData}`)
        return
      }

      const result = await response.json()
      console.log('✅ Análisis automático completado:', result)
      
      // Recargar datos del codex para ver los cambios
      setTimeout(() => {
        loadCodexData()
      }, 2000)

    } catch (err) {
      console.error('❌ Error en análisis automático:', err)
    } finally {
      setIsAutoAnalyzing(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "audio":
        return Headphones
      case "video":
        return Video
      case "documento":
        return FileText
      case "enlace":
        return Link
      case "nota":
        return StickyNote
      default:
        return FileText
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Nuevo":
        return "bg-green-100 text-green-800"
      case "En revisión":
        return "bg-yellow-100 text-yellow-800"
      case "Procesado":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—"
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // NUEVO: useEffect para estructurar los datos para la vista de carpetas
  useEffect(() => {
    const filtered = codexItems
      .filter(item => {
        const queryMatch =
          searchQuery === "" ||
          item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.etiquetas?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.is_group_parent && item.group_name?.toLowerCase().includes(searchQuery.toLowerCase())) // Search group names
        
        const typeMatch = selectedType === "all" || item.tipo === selectedType
        
        return queryMatch && typeMatch
      })

    const topLevel = filtered.filter(item => item.is_group_parent || !item.group_id)
    
    topLevel.sort((a, b) => {
      if (a.is_group_parent && !b.is_group_parent) return -1
      if (!a.is_group_parent && b.is_group_parent) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setTopLevelItems(topLevel)
  }, [codexItems, searchQuery, selectedType])

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return
    
    try {
      const { error } = await supabase
        .from('codex_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user?.id)

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = codexItems.filter(item => item.id !== itemId)
      setCodexItems(updatedItems)
      calculateStats(updatedItems)
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Error al eliminar el elemento')
    }
  }

  // ------------------------------
  // Modal de transcripción
  // ------------------------------

  const handleShowTranscription = (item: CodexItem) => {
    if (item.audio_transcription && item.audio_transcription.trim().length > 0) {
      setTranscriptionModalItem(item)
    }
  }

  const handleViewItem = (item: CodexItem) => {
    // Abrir URL o storage preview si existe
    if (item.url) {
      window.open(item.url, '_blank')
    } else if (item.storage_path) {
      // Podrías implementar vista previa si es necesario
    }
  }

  const handleEditItem = (item: CodexItem) => {
    setEditingItem(item);
    
    // Si tiene project_id, usar ese; sino buscar por nombre del proyecto; sino usar "sin-proyecto"
    let projectValue = 'sin-proyecto';
    if (item.project_id) {
      projectValue = item.project_id;
    } else if (item.proyecto && item.proyecto !== 'Sin proyecto') {
      // Buscar el proyecto por nombre para obtener el ID
      const foundProject = userProjects.find(p => p.title === item.proyecto);
      projectValue = foundProject ? foundProject.id : 'sin-proyecto';
    }
    
    setEditForm({
      titulo: item.titulo,
      descripcion: item.descripcion || '',
      etiquetas: item.etiquetas.join(', '),
      proyecto: projectValue,
      url: item.tipo === 'enlace' ? item.url || '' : '' // Mostrar URL si es un enlace
    });
    setIsEditModalOpen(true);
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !user?.id) return
    
    setIsSubmitting(true)
    try {
      // Get project information
      const selectedProjectData = (editForm.proyecto && editForm.proyecto !== 'sin-proyecto') ? 
        userProjects.find(p => p.id === editForm.proyecto) : null
      
      const updatedData = {
        titulo: editForm.titulo.trim(),
        descripcion: editForm.descripcion.trim() || null,
        etiquetas: editForm.etiquetas.split(',').map(tag => tag.trim()).filter(tag => tag),
        proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
        project_id: selectedProjectData ? editForm.proyecto : null,
        url: editingItem?.tipo === 'enlace' ? editForm.url.trim() || null : editingItem?.url || null
      }

      const { data, error } = await supabase
        .from('codex_items')
        .update(updatedData)
        .eq('id', editingItem.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = codexItems.map(item => 
        item.id === editingItem.id ? { ...item, ...data } : item
      )
      setCodexItems(updatedItems)
      calculateStats(updatedItems)
      
      setIsEditModalOpen(false)
      setEditingItem(null)
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Error al actualizar el elemento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadItem = async (item: CodexItem) => {
    if (!item.storage_path) {
      alert('No hay archivo para descargar')
      return
    }

    try {
      const { data, error } = await supabase.storage
        .from('digitalstorage')
        .download(item.storage_path)

      if (error) throw error

      // Crear URL de descarga
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = item.nombre_archivo || item.titulo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading file:', err)
      alert('Error al descargar el archivo')
    }
  }

  const handleDeleteItemConfirm = async (item: CodexItem) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar "${item.titulo}"?`
    if (!confirm(confirmMessage)) return
    
    setIsSubmitting(true)
    try {
      // Si es un archivo subido, eliminarlo del storage también
      if (item.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('digitalstorage')
          .remove([item.storage_path])
        
        if (storageError) {
          console.warn('Error deleting file from storage:', storageError)
          // Continuar con la eliminación de la base de datos aunque falle el storage
        }
      }

      // Eliminar de la base de datos
      const { error } = await supabase
        .from('codex_items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', user?.id)

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = codexItems.filter(i => i.id !== item.id)
      setCodexItems(updatedItems)
      calculateStats(updatedItems)
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Error al eliminar el elemento')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para determinar si un archivo puede ser transcrito
  const canTranscribe = (item: CodexItem) => {
    // Verificar que el archivo tenga una fuente válida (storage o URL)
    if (!item.storage_path && !item.url) return false
    
    // Formatos de audio soportados
    const audioFormats = ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a']
    // Formatos de video soportados
    const videoFormats = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v']
    
    // Verificar por extensión de archivo si está disponible
    if (item.nombre_archivo) {
      const ext = item.nombre_archivo.toLowerCase()
      const isAudioVideo = audioFormats.some(format => ext.endsWith(format)) || 
                          videoFormats.some(format => ext.endsWith(format))
      if (isAudioVideo) return true
    }
    
    // Verificar por tipo MIME para archivos de Drive
    if (item.is_drive && item.url) {
      return item.tipo === 'audio' || item.tipo === 'video'
    }
    
    // Fallback: verificar por tipo
    return item.tipo === 'audio' || item.tipo === 'video'
  }

  const handleTranscribeItem = async (item: CodexItem) => {
    if (!user?.id) {
      setError('Usuario no autenticado')
      return
    }

    setIsTranscribing(true)
    setTranscriptionProgress(0)
    setError(null)

    try {
      // Validar datos necesarios para Drive files
      if (item.is_drive && (!item.drive_file_id || !item.url)) {
        throw new Error('Archivo de Google Drive incompleto: falta ID o URL del archivo')
      }

      // Obtener token de Google Drive si el archivo proviene de Drive
      let driveToken: string | null = googleDriveToken
      if (item.is_drive) {
        try {
          driveToken = await ensureDriveToken()
        } catch (tokenErr: any) {
          throw new Error(tokenErr.message || 'No fue posible obtener permisos de Google Drive')
        }
      }

      // Simular progreso inicial
      setTranscriptionProgress(10)

      // Preparar datos para la transcripción
      const transcriptionData = {
        codexItemId: item.id,
        titulo: `Transcripción: ${item.titulo}`,
        descripcion: `Transcripción automática del archivo: ${item.titulo}`,
        etiquetas: `${item.etiquetas.join(',')},transcripcion,gemini-ai`,
        proyecto: item.proyecto,
        project_id: item.project_id,
        // Información específica para archivos de Drive
        is_drive: item.is_drive || false,
        drive_file_id: item.drive_file_id || null,
        file_url: item.url || null,
        // Google Drive API access token para acceder al archivo
        drive_access_token: item.is_drive ? driveToken : null,
        // Generar URL de descarga directa para Drive files (fallback)
        download_url: item.is_drive && item.drive_file_id 
          ? `https://drive.google.com/uc?export=download&id=${item.drive_file_id}`
          : null,
        file_name: item.nombre_archivo || null,
        file_type: item.tipo || null,
        file_size: item.tamano || null,
        // Para archivos de Supabase (compatibilidad hacia atrás)
        storage_path: item.storage_path || null
      }

      console.log('🎤 Iniciando transcripción para:', item.titulo)
      console.log('📁 Es archivo de Drive:', item.is_drive)
      console.log('🆔 Drive File ID:', item.drive_file_id)
      console.log('🔗 URL del archivo (view):', item.url)
      console.log('📥 URL de descarga directa:', transcriptionData.download_url)
      console.log('🔑 Token de Drive disponible:', !!googleDriveToken)
      console.log('🔑 Token de Drive (primeros 20 chars):', googleDriveToken ? googleDriveToken.substring(0, 20) + '...' : 'No disponible')
      console.log('📂 Storage path:', item.storage_path)
      console.log('📄 Nombre archivo:', item.nombre_archivo)
      console.log('📊 Tipo archivo:', item.tipo)
      
      // Usar el endpoint existente, pero el backend detectará si es Drive por is_drive flag
      const endpoint = '/api/transcription/from-codex'
      
      console.log('🔗 URL del endpoint:', `${import.meta.env.VITE_EXTRACTORW_API_URL}${endpoint}`)
      console.log('📤 Datos a enviar:', transcriptionData)
      console.log('🗂️ Tipo de archivo:', item.is_drive ? 'Google Drive' : 'Supabase Storage')
      
      setTranscriptionProgress(30)

      // Obtener token desde Supabase AuthContext o localStorage como respaldo
      let accessToken = session?.access_token || localStorage.getItem('token') || ''
      
      // Si no hay token, forzar re-autenticación
      if (!accessToken) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.')
      }
      
      // Usar siempre el token más fresco de la sesión
      if (session?.access_token) {
        accessToken = session.access_token
      }
      console.log('🔑 Token usado:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NO TOKEN')
      console.log('🔑 Session info:', { hasSession: !!session, userEmail: session?.user?.email })

      // Verificar si el token está próximo a expirar y refrescarlo si es necesario
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        const timeToExpiry = expiresAt.getTime() - now.getTime()
        const fiveMinutes = 5 * 60 * 1000

        console.log('🕐 Token expira en:', Math.round(timeToExpiry / 1000 / 60), 'minutos')

        // Si expira en menos de 5 minutos, intentar refrescar
        if (timeToExpiry < fiveMinutes) {
          console.log('🔄 Token próximo a expirar, refrescando...')
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('❌ Error refrescando sesión:', refreshError)
              throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
            }
            console.log('✅ Sesión refrescada exitosamente')
          } catch (refreshErr) {
            console.error('❌ Error durante el refresh:', refreshErr)
            throw new Error('No se pudo refrescar la sesión. Inicia sesión nuevamente.')
          }
        }
      }

      const response = await fetch(`${import.meta.env.VITE_EXTRACTORW_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(transcriptionData)
      })

      setTranscriptionProgress(70)

      if (!response.ok) {
        console.log(`❌ Response Status: ${response.status} ${response.statusText}`)
        console.log(`❌ Response Headers:`, Object.fromEntries(response.headers.entries()))
        
        let errorMessage = `Error ${response.status}: ${response.statusText}${item.is_drive ? ' (archivo de Google Drive)' : ''}`
        
        try {
          const responseText = await response.text()
          console.log(`❌ Response Body:`, responseText)
          
          if (responseText.trim().startsWith('{')) {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || errorData.message || errorMessage
          } else {
            errorMessage = `${errorMessage} - Response: ${responseText.substring(0, 100)}`
          }
        } catch (parseError) {
          console.warn('❌ No se pudo parsear respuesta:', parseError)
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      setTranscriptionProgress(90)

      if (result.success) {
        console.log('✅ Transcripción completada:', result.data.codexItem.id)
        
        // Actualizar lista de items del codex
        await loadCodexData()
        
        setTranscriptionProgress(100)
        
        // Mostrar mensaje de éxito
        const sourceType = item.is_drive ? ' (Google Drive)' : ' (Archivo subido)'
        alert(`¡Transcripción completada${sourceType}! ${result.data.metadata.wordsCount} palabras procesadas. Créditos usados: ${result.data.creditsUsed}`)
      } else {
        throw new Error(result.error || 'Error durante la transcripción')
      }

    } catch (err: any) {
      console.error('❌ Error en transcripción:', err)
      console.log('🔍 Datos del item que falló:', {
        id: item.id,
        titulo: item.titulo,
        is_drive: item.is_drive,
        drive_file_id: item.drive_file_id,
        url: item.url,
        storage_path: item.storage_path,
        nombre_archivo: item.nombre_archivo,
        tipo: item.tipo,
        has_drive_token: !!googleDriveToken,
        drive_token_length: googleDriveToken?.length || 0
      })
      
      const sourceType = item.is_drive ? ' archivo de Google Drive' : ' archivo subido'
      let errorMessage = `Error al transcribir${sourceType}: ${err.message}`
      
      // Agregar sugerencias específicas para archivos de Drive
      if (item.is_drive) {
        if (!googleDriveToken) {
          errorMessage += '\n\nSugerencia: Reconecta tu cuenta de Google Drive para obtener acceso a los archivos.'
        } else {
          errorMessage += '\n\nSugerencia: El backend ahora tiene acceso al token de Google Drive para descargar el archivo.'
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsTranscribing(false)
      setTranscriptionProgress(0)
    }
  }

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      setError('El título y contenido son requeridos')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const tagsArray = noteTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      // Add content type to tags if specified
      const finalTags = contentType.trim() ? [...tagsArray, contentType.trim()] : tagsArray
      
      // Obtener información del proyecto seleccionado
      const selectedProjectData = (selectedProject && selectedProject !== 'sin-proyecto') ? userProjects.find(p => p.id === selectedProject) : null
      
      const noteItem = {
        user_id: user?.id,
        tipo: 'nota',
        titulo: noteTitle.trim(),
        descripcion: noteContent.trim(),
        etiquetas: finalTags,
        proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
        project_id: selectedProjectData ? selectedProject : null,
        ...(RELATIONS_ENABLED && selectedRelatedItems.length > 0 ? { related_items: selectedRelatedItems } : {}),
        fecha: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('codex_items')
        .insert([noteItem])
        .select()
        .single()

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = [...codexItems, data]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      // Limpiar formulario y cerrar modal
      clearForm()

    } catch (err) {
      console.error('Error saving note:', err)
      setError('Error al guardar la nota')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveLink = async (url: string, title: string, description: string, tags: string[], project: string) => {
    if (!url.trim() || !title.trim()) {
      setError('La URL y el título son requeridos')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const finalTags = contentType.trim() ? [...tags, contentType.trim()] : tags
      
      // Get project information
      const selectedProjectData = (project && project !== 'sin-proyecto') ? userProjects.find(p => p.id === project) : null
      
      const newLink = {
        user_id: user?.id,
        tipo: 'enlace',
        titulo: title.trim(),
        descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${description.trim()}`,
        etiquetas: finalTags,
        proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
        project_id: selectedProjectData ? project : null,
        url: url.trim(),
        fecha: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('codex_items')
        .insert([newLink])
        .select()
        .single()

      if (error) throw error

      // Actualizar el estado local
      const updatedItems = [...codexItems, data]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      // Limpiar formulario y cerrar modal
      clearForm()

    } catch (err) {
      console.error('Error saving link:', err)
      setError('Error al guardar el enlace')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para detectar URLs en el texto
  const detectLinks = (text: string) => {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
    const matches = text.match(urlRegex) || []
    return [...new Set(matches)] // Eliminar duplicados
  }

  // Función para detectar si hay enlaces de Twitter/X
  const hasTwitterLinks = (links: string[]) => {
    const twitterPatterns = [
      /twitter\.com\/\w+\/status\/\d+/,
      /x\.com\/\w+\/status\/\d+/
    ]
    
    return links.some(link => 
      twitterPatterns.some(pattern => pattern.test(link))
    )
  }

  // Manejar cambios en el input de enlaces
  const handleLinksInputChange = (value: string) => {
    setLinksInput(value)
    const links = detectLinks(value)
    setDetectedLinks(links)
  }

  // Guardar enlaces múltiples
  const handleSaveMultipleLinks = async () => {
    if (detectedLinks.length === 0) {
      setError('No se detectaron enlaces válidos')
      return
    }

    if (!linkTitle.trim()) {
      setError('El título es requerido')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const tagsArray = linkTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      const finalTags = contentType.trim() ? [...tagsArray, contentType.trim()] : tagsArray
      
      // Get project information
      const selectedProjectData = (linkProject && linkProject !== 'sin-proyecto') ? 
        userProjects.find(p => p.id === linkProject) : null

      const savedLinks = []

      // Crear un elemento por cada enlace detectado
      for (let i = 0; i < detectedLinks.length; i++) {
        const url = detectedLinks[i]
        const title = detectedLinks.length === 1 ? 
          linkTitle.trim() : 
          `${linkTitle.trim()} - Enlace ${i + 1}`

        let description = `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${linkDescription.trim()}`
        
        // Nota: La generación de descripción con IA ahora se hace automáticamente 
        // en el backend después de la transcripción cuando shouldGenerateDescription=true

        const newLink = {
          user_id: user?.id,
          tipo: 'enlace',
          titulo: title,
          descripcion: description,
          etiquetas: finalTags,
          proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
          project_id: selectedProjectData ? linkProject : null,
          url: url,
          fecha: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('codex_items')
          .insert([newLink])
          .select()
          .single()

        if (error) throw error
        savedLinks.push(data)
      }

      // Actualizar el estado local
      const updatedItems = [...codexItems, ...savedLinks]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      // Si se marcó análisis automático y hay enlaces de Twitter/X, ejecutar análisis en segundo plano
      if (shouldAnalyzeLinks && hasTwitterLinks(detectedLinks)) {
        const linksToAnalyze = savedLinks
          .filter(link => hasTwitterLinks([link.url]))
          .map(link => link.id)
        
        if (linksToAnalyze.length > 0) {
          console.log('🚀 Iniciando análisis automático para', linksToAnalyze.length, 'enlaces de X')
          
          // Mensaje diferente dependiendo de si también se generará descripción
          alert(`✨ Análisis automático iniciado para ${linksToAnalyze.length} enlace(s) de X. El proceso se ejecutará en segundo plano.`)
          
          // Ejecutar en segundo plano sin esperar, incluyendo el flag de descripción
          executeAutoAnalysis(linksToAnalyze, shouldGenerateDescription)
        }
      }

      // Limpiar formulario y cerrar modal
      clearForm()

    } catch (err) {
      console.error('Error saving links:', err)
      setError('Error al guardar los enlaces')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Save Drive File
  const handleSaveDriveFile = async (fileParam?: any) => {
    console.log('💾 Guardando archivo de Drive')
    
    const driveFile = fileParam || selectedDriveFile

    if (!driveFile) {
      console.error('❌ No hay archivo de Drive seleccionado')
      setError('Selecciona un archivo de Google Drive')
      return
    }

    // Tomar título por defecto si no se ingresó manualmente
    const effectiveTitle = driveTitle.trim() || driveFile.name

    setIsSubmitting(true)
    setError(null)

    try {
      // --------------------------------------------------
      // 1) Obtener token válido (desde hook)
      // --------------------------------------------------
      let accessToken = driveToken
      if (!accessToken) {
        throw new Error('Necesitas conectar Google Drive antes de guardar el archivo')
      }

      console.log('🔑 Token de Drive obtenido (primeros 20 chars):', accessToken.substring(0, 20) + '...')

      // --------------------------------------------------
      // 2) Descargar archivo de Drive como blob
      // --------------------------------------------------
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media&supportsAllDrives=true`
      console.log('⬇️ Descargando archivo Drive desde:', downloadUrl)

      const downloadResp = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!downloadResp.ok) {
        throw new Error(`Error descargando archivo de Drive (${downloadResp.status})`)
      }

      const fileBlob = await downloadResp.blob()
      console.log('✅ Archivo Drive descargado, tamaño:', fileBlob.size)

      // --------------------------------------------------
      // 3) Subir archivo a Supabase Storage
      // --------------------------------------------------
      const fileExt = driveFile.name.split('.').pop() || 'bin'
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = getStoragePath(driveProject || 'sin-proyecto', uniqueName)

      console.log('⬆️ Subiendo a Supabase Storage en path:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('digitalstorage')
        .upload(filePath, fileBlob, {
          contentType: driveFile.mimeType || 'application/octet-stream'
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('digitalstorage')
        .getPublicUrl(filePath)

      console.log('✅ Archivo subido. URL pública:', urlData.publicUrl)

      // --------------------------------------------------
      // 4) Determinar tipo (audio, video, documento)
      // --------------------------------------------------
      let tipo = 'documento'
      if (driveFile.mimeType?.startsWith('image/')) tipo = 'imagen'
      else if (driveFile.mimeType?.startsWith('video/')) tipo = 'video'
      else if (driveFile.mimeType?.startsWith('audio/')) tipo = 'audio'

      // --------------------------------------------------
      // 5) Preparar metadata y guardar en codex_items
      // --------------------------------------------------
      const tagsArray = driveTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      const finalTags = contentType.trim() ? [...tagsArray, contentType.trim()] : tagsArray

      const selectedProjectData = (driveProject && driveProject !== 'sin-proyecto') ? 
        userProjects.find(p => p.id === driveProject) : null

      const codexItem = {
        user_id: user?.id,
        tipo,
        titulo: effectiveTitle,
        descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${driveDescription.trim() || `Archivo importado de Google Drive: ${driveFile.name}`}`,
        etiquetas: finalTags,
        proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
        project_id: selectedProjectData ? driveProject : null,
        storage_path: filePath, // Ya está en Supabase
        url: urlData.publicUrl,
        nombre_archivo: driveFile.name,
        tamano: fileBlob.size,
        fecha: new Date().toISOString(),
        is_drive: false, // Ya no necesitamos tratarlo como Drive para transcripción
        drive_file_id: driveFile.id // Guardamos referencia por si acaso
      }

      console.log('💾 Insertando item en codex_items:', codexItem)

      const { data, error } = await supabase
        .from('codex_items')
        .insert([codexItem])
        .select()
        .single()

      if (error) throw error

      console.log('✅ Archivo de Drive guardado en Codex:', data)

      // Actualizar estado local
      const updatedItems = [...codexItems, data]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      clearForm()

    } catch (err: any) {
      console.error('❌ Error guardando archivo de Drive:', err)
      setError(err.message || 'Error al guardar el archivo de Google Drive')
    } finally {
      setIsSubmitting(false)
    }
  }

  // File validation
  const validateFile = (file: File) => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = [
      'image/*',
      'video/*', 
      'audio/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/*'
    ]
    
    if (file.size > maxSize) {
      return `El archivo ${file.name} es muy grande. Máximo 100MB.`
    }
    
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
    
    if (!isValidType) {
      return `Tipo de archivo no permitido: ${file.type}`
    }
    
    return null
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []
    
    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })
    
    if (errors.length > 0) {
      setError(errors.join('\n'))
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    const validFiles: File[] = []
    const errors: string[] = []
    
    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })
    
    if (errors.length > 0) {
      setError(errors.join('\n'))
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload files to Supabase Storage
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos un archivo para subir')
      return
    }

    if (!user?.id) {
      setError('Usuario no autenticado. Por favor, inicia sesión.')
      return
    }

    setIsUploading(true)
    setIsSubmitting(true)
    setError(null)

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        // Generate unique filename and get storage path based on project
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = getStoragePath(uploadProject, fileName)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('digitalstorage')
          .upload(filePath, file, {
            onUploadProgress: (progress) => {
              const percent = (progress.loaded / progress.total) * 100
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: percent
              }))
            }
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('digitalstorage')
          .getPublicUrl(filePath)

        // Determine file type based on MIME type
        let tipo = 'documento'
        if (file.type.startsWith('image/')) tipo = 'imagen'
        else if (file.type.startsWith('video/')) tipo = 'video'
        else if (file.type.startsWith('audio/')) tipo = 'audio'

        // Prepare metadata
        const tagsArray = uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        const finalTags = contentType.trim() ? [...tagsArray, contentType.trim()] : tagsArray

        // Get project information
        const selectedProjectData = (uploadProject && uploadProject !== 'sin-proyecto') ? userProjects.find(p => p.id === uploadProject) : null

        // Save to codex_items table
        const codexItem = {
          user_id: user?.id,
          tipo,
          titulo: uploadTitle.trim() || file.name,
          descripcion: `${contentType.trim() ? `[${contentType.trim()}] ` : ''}${uploadDescription.trim() || `Archivo subido: ${file.name}`}`,
          etiquetas: finalTags,
          proyecto: selectedProjectData ? selectedProjectData.title : 'Sin proyecto',
          project_id: selectedProjectData ? uploadProject : null,
          storage_path: filePath,
          url: urlData.publicUrl,
          nombre_archivo: file.name,
          tamano: file.size,
          fecha: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('codex_items')
          .insert([codexItem])
          .select()
          .single()

        if (error) throw error

        return data
      })

      const results = await Promise.all(uploadPromises)
      
      // Update local state
      const updatedItems = [...codexItems, ...results]
      setCodexItems(updatedItems)
      calculateStats(updatedItems)

      // Si el usuario marcó "es parte de una serie" y subió audio/video, abrir modal de grupo
      if (isPartOfSeries && results.length > 0) {
        const uploadedItem = results[0] // Tomar el primer archivo subido
        if (canBeGrouped(uploadedItem)) {
          // Limpiar formulario pero mantener modal principal abierto temporalmente
          setSelectedFiles([])
          setUploadProgress({})
          
          // Abrir modal de grupo con el item recién subido
          setSelectedItemForGroup(uploadedItem)
          setGroupForm({
            group_name: uploadedItem.titulo || 'Nuevo Grupo',
            group_description: '',
            parent_item_id: uploadedItem.id
          })
          setIsGroupModalOpen(true)
          
          // Cerrar el modal principal después de un momento
          setTimeout(() => {
            setIsModalOpen(false)
            setSelectedSourceType(null)
          }, 500)
          
          return // No limpiar completamente el formulario aún
        }
      }

      // Clear form and close modal (solo si no se está creando grupo)
      clearForm()
      setSelectedFiles([])
      setUploadProgress({})

    } catch (err) {
      console.error('Error uploading files:', err)
      setError(`Error al subir archivos: ${err.message}`)
    } finally {
      setIsUploading(false)
      setIsSubmitting(false)
    }
  }

  const clearForm = () => {
    setNoteTitle("")
    setNoteContent("")
    setNoteTags("")
    setSelectedProject("")
    setContentType("")
    setSelectedRelatedItems([])
    setShowRelationSelector(false)
    setUploadTitle("")
    setUploadDescription("")
    setUploadTags("")
    setUploadProject("")
    setIsPartOfSeries(false)
    setDriveTitle("")
    setDriveDescription("")
    setDriveTags("")
    setDriveProject("")
    setSelectedSourceType(null)
    setIsModalOpen(false)
    // Reset metadata toggles
    setShowUploadMetadata(false)
    setShowDriveMetadata(false)
    setShowNoteMetadata(false)
    setShowLinkMetadata(false)
    // Reset file states
    setSelectedFiles([])
    setUploadProgress({})
    setIsUploading(false)
    setSelectedDriveFile(null)
    setDriveFiles([])
    setIsDriveConnected(false)
    // Reset link states
    setLinksInput("")
    setDetectedLinks([])
    setLinkTitle("")
    setLinkDescription("")
    setLinkTags("")
    setLinkProject("")
    setShouldAnalyzeLinks(false)
    // Reset edit states
    setIsEditModalOpen(false)
    setEditingItem(null)
    setEditForm({
      titulo: '',
      descripcion: '',
      etiquetas: '',
      proyecto: ''
    })
    // Reset group states
    setIsGroupModalOpen(false)
    setGroupForm({
      group_name: '',
      group_description: '',
      parent_item_id: ''
    })
    setSelectedItemForGroup(null)
    setShowAddToGroupModal(false)
    setSelectedGroup('')
    setPartNumber(1)
    setShowGroupDetails(null)
    // No limpiamos el token del hook useGoogleDrive para mantener la sesión activa
    // El hook maneja su propio estado y limpieza cuando es necesario
    setShouldGenerateDescription(false);
  }

  // ===================================================================
  // FUNCIONES DE AGRUPAMIENTO
  // ===================================================================

  /**
   * Verificar si un item puede ser agrupado (audio o video)
   */
  const canBeGrouped = (item: CodexItem) => {
    return item.tipo === 'audio' || item.tipo === 'video' || item.tipo === 'enlace';
  }

  /**
   * Crear un nuevo grupo a partir de un item existente
   */
  const handleCreateGroup = async (item: CodexItem) => {
    try {
      if (!user?.id) {
        setError('No se pudo identificar al usuario')
        return
      }

      const result = await createCodexGroup(user.id, {
        group_name: groupForm.group_name,
        group_description: groupForm.group_description,
        parent_item_id: item.id
      })

      // Actualizar el item en el estado local
      const updatedItems = codexItems.map(i => 
        i.id === item.id ? { ...i, ...result } : i
      )
      setCodexItems(updatedItems)

      setIsGroupModalOpen(false)
      setGroupForm({ group_name: '', group_description: '', parent_item_id: '' })
      setSelectedItemForGroup(null)

      // Recargar datos para asegurar consistencia
      await loadCodexData()

    } catch (error) {
      console.error('Error creando grupo:', error)
      setError(`Error al crear grupo: ${error.message}`)
    }
  }

  /**
   * Agregar item a un grupo existente
   */
  const handleAddToGroup = async () => {
    try {
      if (!user?.id || !selectedItemForGroup || !selectedGroup) {
        setError('Faltan datos para agregar al grupo')
        return
      }

      // Si partNumber no se especifica correctamente, usar la siguiente parte disponible
      let finalPartNumber = partNumber
      if (!finalPartNumber || finalPartNumber < 1) {
        const grp = availableGroups.find(g => (g.group_id || g.id) === selectedGroup)
        finalPartNumber = (grp?.total_parts || 0) + 1
      }

      await addItemToGroup(
        selectedItemForGroup.id,
        selectedGroup,
        finalPartNumber,
        user.id
      )

      setShowAddToGroupModal(false)
      setSelectedItemForGroup(null)
      setSelectedGroup('')
      setPartNumber(1)

      // Recargar datos
      await loadCodexData()

    } catch (error) {
      console.error('Error agregando al grupo:', error)
      setError(`Error al agregar al grupo: ${error.message}`)
    }
  }

  /**
   * Remover item de su grupo actual
   */
  const handleRemoveFromGroup = async (item: CodexItem) => {
    try {
      if (!user?.id) {
        setError('No se pudo identificar al usuario')
        return
      }

      await removeItemFromGroup(item.id, user.id)
      
      // Recargar datos
      await loadCodexData()

    } catch (error) {
      console.error('Error removiendo del grupo:', error)
      setError(`Error al remover del grupo: ${error.message}`)
    }
  }

  /**
   * Eliminar grupo completo
   */
  const handleDeleteGroup = async (groupId: string) => {
    try {
      if (!user?.id) {
        setError('No se pudo identificar al usuario')
        return
      }

      console.log('Attempting to delete group:', groupId, 'by user:', user.id);

      if (confirm('¿Estás seguro de que quieres eliminar todo el grupo? Esta acción no se puede deshacer.')) {
        await deleteGroup(groupId, user.id)
        
        // Recargar datos
        await loadCodexData()
      }

    } catch (error) {
      console.error('Error eliminando grupo:', error)
      setError(`Error al eliminar grupo: ${error?.message || 'Error desconocido'}`)
    }
  }

  /**
   * Cargar grupos disponibles para agregar items
   */
  const loadAvailableGroups = async () => {
    try {
      if (!user?.id) return

      const groups = await getUserGroups(user.id)
      // Normalizar group_id para grupos antiguos que puedan no tenerlo (usar id como fallback)
      const normalizedGroups = groups.map((g: any) => ({
        ...g,
        group_id: g.group_id || g.id,
        total_parts: g.total_parts || 0
      }))
      setAvailableGroups(normalizedGroups)

    } catch (error) {
      console.error('Error cargando grupos:', error)
    }
  }

  /**
   * Manejar apertura del modal para crear grupo
   */
  const handleOpenGroupModal = (item: CodexItem) => {
    setSelectedItemForGroup(item)
    setGroupForm({
      ...groupForm,
      parent_item_id: item.id
    })
    setIsGroupModalOpen(true)
  }

  /**
   * Manejar apertura del modal para agregar a grupo existente
   */
  const handleOpenAddToGroupModal = async (item: CodexItem) => {
    setSelectedItemForGroup(item)
    await loadAvailableGroups()
    setShowAddToGroupModal(true)
  }

  // Predefined content types for suggestions
  const contentTypeSuggestions = [
    "Conferencia de prensa",
    "Entrevista exclusiva",
    "Documento legal",
    "Informe oficial",
    "Testimonio",
    "Declaración pública",
    "Investigación periodística",
    "Filtración",
    "Audio grabado",
    "Video testimonio",
    "Documento confidencial",
    "Expediente judicial",
    "Comunicado oficial",
    "Transcripción",
    "Evidencia documental"
  ]

  const statsConfig = [
    { label: "Documentos", count: stats.documentos, icon: FileText, color: "bg-blue-500", type: "documento" },
    { label: "Audios", count: stats.audios, icon: Headphones, color: "bg-purple-500", type: "audio" },
    { label: "Videos", count: stats.videos, icon: Video, color: "bg-green-500", type: "video" },
    { label: "Enlaces", count: stats.enlaces, icon: Link, color: "bg-orange-500", type: "enlace" },
    { label: "Notas", count: stats.notas, icon: StickyNote, color: "bg-pink-500", type: "nota" },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Acceso Requerido</h3>
            <p className="text-slate-600">Necesitas iniciar sesión para acceder al Codex.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                <Archive className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Codex</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Tu archivo personal de fuentes, documentos, audios, videos y enlaces. Conecta tu Google Drive para
              comenzar a organizar y analizar tus materiales periodísticos.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {statsConfig.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedType(stat.type)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-3xl font-bold text-slate-900">{stat.count}</p>
                        </div>
                      </div>
                      <div className={`${stat.color} p-3 rounded-xl`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Banner de Enlaces Pendientes */}


          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Nueva Fuente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-0">
                <DialogHeader className="p-6 pb-4">
                  <DialogTitle className="text-xl font-semibold text-slate-900">Agregar Nueva Fuente</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Selecciona cómo quieres agregar tu nueva fuente al Codex
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
                  {!selectedSourceType ? (
                    <div className="grid gap-4">
                      {/* Upload from Computer */}
                      <Card
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-blue-200"
                        onClick={() => setSelectedSourceType("upload")}
                      >
                        <CardContent className="flex items-center gap-4 p-6">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <Upload className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">Subir desde Computadora</h3>
                            <p className="text-sm text-slate-600">
                              Sube documentos, audios, videos desde tu dispositivo
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Connect Google Drive */}
                      {DRIVE_ENABLED && (
                        <Card
                          className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-green-200"
                          onClick={() => alert('Función Google Drive deshabilitada temporalmente')}
                        >
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="bg-green-100 p-3 rounded-lg">
                              <Cloud className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">Conectar Google Drive</h3>
                              <p className="text-sm text-slate-600">Función deshabilitada temporalmente</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {NOTE_ENABLED && (
                        <Card
                          className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-purple-200"
                          onClick={() => setSelectedSourceType("note")}
                        >
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="bg-purple-100 p-3 rounded-lg">
                              <StickyNote className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">Agregar Nota o Término</h3>
                              <p className="text-sm text-slate-600">Crea una nota de texto o define un término clave</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Add Multiple Links */}
                      <Card
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-orange-200"
                        onClick={() => setSelectedSourceType("links")}
                      >
                        <CardContent className="flex items-center gap-4 p-6">
                          <div className="bg-orange-100 p-3 rounded-lg">
                            <Link className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">Agregar Enlaces</h3>
                            <p className="text-sm text-slate-600">Agrega múltiples enlaces web con detección automática</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Back button */}
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedSourceType(null)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        ← Volver
                      </Button>

                      {/* Upload Form */}
                      {selectedSourceType === "upload" && (
                        <div className="space-y-4">
                          {/* Main Upload Area */}
                          <div 
                            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                          >
                            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 mb-2">Arrastra y suelta tus archivos aquí</p>
                            <p className="text-sm text-slate-500 mb-4">o</p>
                            <input
                              type="file"
                              multiple
                              onChange={handleFileSelect}
                              className="hidden"
                              id="file-upload"
                              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                            />
                            <Button 
                              variant="outline" 
                              onClick={() => document.getElementById('file-upload')?.click()}
                            >
                              Seleccionar Archivos
                            </Button>
                          </div>

                          {/* Selected Files List */}
                          {selectedFiles.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-slate-700">Archivos seleccionados:</h4>
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    <div>
                                      <p className="text-sm font-medium text-slate-700">{file.name}</p>
                                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {uploadProgress[file.name] && (
                                      <div className="w-16 bg-slate-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${uploadProgress[file.name]}%` }}
                                        />
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSelectedFile(index)}
                                      disabled={isUploading}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Optional Metadata Section */}
                          <div className="border border-slate-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setShowUploadMetadata(!showUploadMetadata)}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">Información adicional</span>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  Opcional
                                </Badge>
                              </div>
                              {showUploadMetadata ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </button>
                            
                            {showUploadMetadata && (
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                                <div className="space-y-2">
                                  <Label htmlFor="content-type">Tipo de Contenido</Label>
                                  <Input
                                    id="content-type"
                                    placeholder="Ej: Conferencia de prensa, Entrevista, Documento legal..."
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    list="content-suggestions"
                                  />
                                  <datalist id="content-suggestions">
                                    {contentTypeSuggestions.map((suggestion, index) => (
                                      <option key={index} value={suggestion} />
                                    ))}
                                  </datalist>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="upload-title">Título personalizado</Label>
                                  <Input
                                    id="upload-title"
                                    placeholder="Ej: Conferencia Ministro de Salud - COVID-19"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="upload-description">Descripción</Label>
                                  <Textarea
                                    id="upload-description"
                                    placeholder="Breve descripción del contenido y contexto..."
                                    rows={3}
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="upload-tags">Etiquetas</Label>
                                  <Input
                                    id="upload-tags"
                                    placeholder="Ej: salud, gobierno, covid, oficial"
                                    value={uploadTags}
                                    onChange={(e) => setUploadTags(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="upload-project">Proyecto</Label>
                                  <Select value={uploadProject} onValueChange={setUploadProject}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                                      {userProjects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                          {project.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* Checkbox para agrupar en series */}
                                {selectedFiles.some(file => 
                                  file.type.startsWith('audio/') || file.type.startsWith('video/')
                                ) && (
                                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <Checkbox
                                      checked={isPartOfSeries}
                                      onChange={(e) => setIsPartOfSeries(e.target.checked)}
                                      inputProps={{ 'aria-label': 'controlled' }}
                                    />
                                    <div>
                                      <Label htmlFor="is-part-of-series" className="text-blue-900 font-medium cursor-pointer">
                                        Es parte de una serie
                                      </Label>
                                      <p className="text-xs text-blue-700 mt-1">
                                        Marcar si este audio/video forma parte de una serie o grupo (ej: entrevista en varias partes)
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Google Drive Form */}
                      {selectedSourceType === "drive" && (
                        <div className="space-y-4">
                          {/* Main Drive Connection */}
                          {!hasValidToken ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                              <Cloud className="h-12 w-12 text-green-600 mx-auto mb-4" />
                              <h3 className="font-semibold text-green-900 mb-2">Conectar con Google Drive</h3>
                              <p className="text-green-700 mb-4">
                                Autoriza el acceso para vincular archivos desde tu Drive
                              </p>
                              {driveError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                  <p className="text-red-700 text-sm">{driveError}</p>
                                </div>
                              )}
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  openPicker((file) => {
                                    const pickedFile = {
                                      id: file.id,
                                      name: file.name,
                                      mimeType: file.mimeType,
                                      size: 0,
                                      webViewLink: file.url,
                                      thumbnailLink: ''
                                    };
                                    setSelectedDriveFile(pickedFile);
                                    setDriveTitle(file.name);
                                    setDriveFiles([pickedFile]);
                                    setIsDriveConnected(true);
                                    
                                    // Guardar automáticamente el archivo en el Codex tras la selección
                                    setTimeout(() => {
                                      handleSaveDriveFile(pickedFile);
                                    }, 0);
                                  });
                                }}
                                disabled={driveLoading || !canUseDrive}
                              >
                                {driveLoading ? (
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Cloud className="h-4 w-4 mr-2" />
                                )}
                                {driveLoading ? 'Conectando...' : 'Conectar Google Drive'}
                              </Button>
                              {!canUseDrive && (
                                <p className="text-orange-600 text-sm mt-2">
                                  Necesitas iniciar sesión con Google para usar esta función
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-green-700">
                                    <Cloud className="h-5 w-5" />
                                    <span className="font-medium">Google Drive conectado</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      openPicker((file) => {
                                        const pickedFile = {
                                          id: file.id,
                                          name: file.name,
                                          mimeType: file.mimeType,
                                          size: 0,
                                          webViewLink: file.url,
                                          thumbnailLink: ''
                                        };
                                        setSelectedDriveFile(pickedFile);
                                        setDriveTitle(file.name);
                                        setDriveFiles([pickedFile]);
                                        
                                        // Guardar automáticamente el archivo en el Codex tras la selección
                                        setTimeout(() => {
                                          handleSaveDriveFile(pickedFile);
                                        }, 0);
                                      });
                                    }}
                                    disabled={driveLoading}
                                  >
                                    {driveLoading ? (
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    Seleccionar otro archivo
                                  </Button>
                                </div>
                              </div>

                              {/* Drive Files List */}
                              {driveFiles.length > 0 && (
                                <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                                    <h4 className="font-medium text-slate-700">Archivo seleccionado:</h4>
                                  </div>
                                  <div className="p-2">
                                    {driveFiles.map((file) => (
                                      <div
                                        key={file.id}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                                      >
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        <div className="flex-1 text-left">
                                          <p className="text-sm font-medium text-slate-700">{file.name}</p>
                                          <p className="text-xs text-slate-500">
                                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Tamaño desconocido'} • 
                                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Fecha desconocida'}
                                          </p>
                                        </div>
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                          ✓ Seleccionado
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Optional Metadata Section */}
                          <div className="border border-slate-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setShowDriveMetadata(!showDriveMetadata)}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">Información adicional</span>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  Opcional
                                </Badge>
                              </div>
                              {showDriveMetadata ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </button>
                            
                            {showDriveMetadata && (
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                                <p className="text-sm text-slate-600">
                                  Completa la información del archivo una vez conectado:
                                </p>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-content-type">Tipo de Contenido</Label>
                                  <Input
                                    id="drive-content-type"
                                    placeholder="Ej: Conferencia de prensa, Entrevista, Documento legal..."
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    list="content-suggestions"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-title">Título personalizado</Label>
                                  <Input
                                    id="drive-title"
                                    placeholder="Ej: Conferencia Ministro de Salud - COVID-19"
                                    value={driveTitle}
                                    onChange={(e) => setDriveTitle(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-description">Descripción</Label>
                                  <Textarea
                                    id="drive-description"
                                    placeholder="Breve descripción del contenido y contexto..."
                                    rows={3}
                                    value={driveDescription}
                                    onChange={(e) => setDriveDescription(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-tags">Etiquetas</Label>
                                  <Input
                                    id="drive-tags"
                                    placeholder="Ej: salud, gobierno, covid, oficial"
                                    value={driveTags}
                                    onChange={(e) => setDriveTags(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="drive-project">Proyecto</Label>
                                  <Select value={driveProject} onValueChange={setDriveProject}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                                      {userProjects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                          {project.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Note/Term Form */}
                      {selectedSourceType === "note" && (
                        <div className="space-y-4">
                          {/* Required Note Fields */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="note-title">Título *</Label>
                              <Input 
                                id="note-title" 
                                placeholder="Ej: Término clave sobre corrupción municipal"
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="note-content">Contenido *</Label>
                              <Textarea
                                id="note-content"
                                placeholder="Escribe tu nota, definición o término clave aquí..."
                                rows={6}
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          {/* Optional Metadata Section */}
                          <div className="border border-slate-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setShowNoteMetadata(!showNoteMetadata)}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">Información adicional</span>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  Opcional
                                </Badge>
                              </div>
                              {showNoteMetadata ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </button>
                            
                            {showNoteMetadata && (
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                                <div className="space-y-2">
                                  <Label htmlFor="note-content-type">Tipo de Contenido</Label>
                                  <Input
                                    id="note-content-type"
                                    placeholder="Ej: Testimonio, Transcripción, Definición legal..."
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    list="content-suggestions"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="note-tags">Etiquetas</Label>
                                  <Input 
                                    id="note-tags" 
                                    placeholder="Ej: definición, corrupción, legal"
                                    value={noteTags}
                                    onChange={(e) => setNoteTags(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="project-select">Proyecto</Label>
                                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                                      {userProjects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                          {project.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Relations Section */}
                                {RELATIONS_ENABLED && (
                                  <div className="space-y-2 border-t border-slate-200 pt-4">
                                    <div className="flex items-center justify-between">
                                      <Label>Relacionar con archivos</Label>
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setShowRelationSelector(!showRelationSelector)}
                                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                      >
                                        <Link className="h-4 w-4 mr-1" />
                                        Relacionar
                                      </Button>
                                    </div>
                                    
                                    {showRelationSelector && (
                                      <div className="space-y-3 bg-slate-50 p-3 rounded-lg">
                                        <p className="text-sm text-slate-600">
                                          Selecciona archivos de tu Codex para relacionar con esta nota:
                                        </p>
                                        <div className="max-h-40 overflow-y-auto space-y-2">
                                          {codexItems
                                            .filter(item => item.tipo !== 'nota' && item.id)
                                            .slice(0, 10)
                                            .map((item) => (
                                              <div key={item.id} className="flex items-center gap-2">
                                                <Checkbox
                                                  checked={selectedRelatedItems.includes(item.id)}
                                                  onChange={(e) => {
                                                    if (e.target.checked) {
                                                      setSelectedRelatedItems([...selectedRelatedItems, item.id])
                                                    } else {
                                                      setSelectedRelatedItems(selectedRelatedItems.filter(id => id !== item.id))
                                                    }
                                                  }}
                                                  inputProps={{ 'aria-label': item.id }}
                                                />
                                                <label 
                                                  htmlFor={`relation-${item.id}`}
                                                  className="flex-1 text-sm cursor-pointer flex items-center gap-2"
                                                >
                                                  {(() => {
                                                    const IconComponent = getTypeIcon(item.tipo)
                                                    return <IconComponent className="h-3 w-3 text-slate-500" />
                                                  })()}
                                                  <span className="truncate">{item.titulo}</span>
                                                  <span className="text-xs text-slate-400 uppercase">
                                                    {item.tipo}
                                                  </span>
                                                </label>
                                              </div>
                                            ))}
                                        </div>
                                        {selectedRelatedItems.length > 0 && (
                                          <div className="text-xs text-slate-600">
                                            {selectedRelatedItems.length} archivo(s) seleccionado(s)
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Links Form */}
                      {selectedSourceType === "links" && (
                        <div className="space-y-4">
                          {/* Links Input */}
                          <div className="space-y-2">
                            <Label htmlFor="links-input">Enlaces *</Label>
                            <Textarea
                              id="links-input"
                              placeholder="Pega aquí uno o múltiples enlaces web, separados por líneas o espacios..."
                              rows={4}
                              value={linksInput}
                              onChange={(e) => handleLinksInputChange(e.target.value)}
                            />
                            {detectedLinks.length > 0 && (
                              <div className="text-sm text-green-600">
                                ✓ {detectedLinks.length} enlace(s) detectado(s)
                              </div>
                            )}
                          </div>

                          {/* Analysis Checkbox - Solo mostrar para enlaces de Twitter/X */}
                          {hasTwitterLinks(detectedLinks) && (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={shouldAnalyzeLinks}
                                  onChange={(e) => setShouldAnalyzeLinks(e.target.checked)}
                                  inputProps={{ 'aria-label': 'controlled' }}
                                />
                                <Label htmlFor="analyze-links" className="text-sm font-medium cursor-pointer">
                                  ✨ Analizar automáticamente enlaces de X 
                                  {isAutoAnalyzing && (
                                    <span className="ml-2 text-blue-600 text-xs">
                                      (análisis en progreso...)
                                    </span>
                                  )}
                                </Label>
                              </div>
                              {shouldAnalyzeLinks && (
                                <div className="flex items-center space-x-2 ml-6">
                                  <Checkbox
                                    checked={shouldGenerateDescription}
                                    onChange={(e) => setShouldGenerateDescription(e.target.checked)}
                                    inputProps={{ 'aria-label': 'controlled' }}
                                  />
                                  <Label htmlFor="generate-description" className="text-sm font-medium cursor-pointer text-gray-600">
                                    Generar Descripción
                                  </Label>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Optional Metadata Section */}
                          <div className="border border-slate-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setShowLinkMetadata(!showLinkMetadata)}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">Información adicional</span>
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  Opcional
                                </Badge>
                              </div>
                              {showLinkMetadata ? (
                                <ChevronUp className="h-4 w-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-500" />
                              )}
                            </button>
                            
                            {showLinkMetadata && (
                              <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
                                <div className="space-y-2">
                                  <Label htmlFor="link-title">Título personalizado</Label>
                                  <Input
                                    id="link-title"
                                    placeholder="Ej: Artículos sobre corrupción municipal"
                                    value={linkTitle}
                                    onChange={(e) => setLinkTitle(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="link-description">Descripción</Label>
                                  <Textarea
                                    id="link-description"
                                    placeholder="Breve descripción del contenido de los enlaces..."
                                    rows={3}
                                    value={linkDescription}
                                    onChange={(e) => setLinkDescription(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="link-tags">Etiquetas</Label>
                                  <Input 
                                    id="link-tags" 
                                    placeholder="Ej: prensa, investigación, reportaje"
                                    value={linkTags}
                                    onChange={(e) => setLinkTags(e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="link-project">Proyecto</Label>
                                  <Select value={linkProject} onValueChange={setLinkProject}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                                      {userProjects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                          {project.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <DialogFooter className="p-6 bg-slate-50 border-t -mx-6 -mb-4 mt-4">
                        <Button
                          onClick={clearForm}
                          variant="outline"
                          className="flex-1"
                          disabled={isSubmitting || isUploading}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={
                            isSubmitting || 
                            isUploading ||
                            (selectedSourceType === "note" && (!noteTitle.trim() || !noteContent.trim())) ||
                            (selectedSourceType === "upload" && selectedFiles.length === 0) ||
                            (selectedSourceType === "drive" && (!isDriveConnected || !selectedDriveFile)) ||
                            (selectedSourceType === "links" && detectedLinks.length === 0)
                          }
                          onClick={() => {
                            if (selectedSourceType === "note") {
                              handleSaveNote()
                            } else if (selectedSourceType === "upload") {
                              handleUploadFiles()
                            } else if (selectedSourceType === "drive") {
                              handleSaveDriveFile()
                            } else if (selectedSourceType === "links") {
                              handleSaveMultipleLinks()
                            }
                          }}
                        >
                          {(isSubmitting || isUploading) ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          {selectedSourceType === "upload" && (isUploading ? "Subiendo archivos..." : `Subir ${selectedFiles.length} archivo(s)`)}
                          {selectedSourceType === "drive" && (isSubmitting ? "Guardando..." : "Guardar desde Drive")}
                          {selectedSourceType === "note" && (isSubmitting ? "Guardando..." : "Guardar Nota")}
                          {selectedSourceType === "links" && (isSubmitting ? "Guardando..." : `Guardar ${detectedLinks.length} enlace(s)`)}
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-3 rounded-xl"
              onClick={loadCodexData}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              {isLoading ? 'Actualizando...' : 'Explorar Codex'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 max-w-2xl mx-auto">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isTranscribing && (
            <div className="mt-4 max-w-2xl mx-auto">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5 text-blue-500 animate-pulse" />
                      <p className="text-blue-600 font-medium">Transcribiendo archivo con Gemini AI...</p>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${transcriptionProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-blue-600">{transcriptionProgress}% completado</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por título, proyecto, etiquetas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48 h-12 border-slate-200">
                    <SelectValue placeholder="Tipo de fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="documento">Documentos</SelectItem>
                    <SelectItem value="audio">Audios</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="enlace">Enlaces</SelectItem>
                    <SelectItem value="nota">Notas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48 h-12 border-slate-200">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="revision">En revisión</SelectItem>
                    <SelectItem value="procesado">Procesado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="lg" className="h-12 px-4 border-slate-200">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Toolbar de selección */}
            <div className="flex flex-wrap gap-3 mt-4">
              {!selectionMode ? (
                <Button variant="outline" size="lg" onClick={() => setSelectionMode(true)}>
                  Seleccionar archivos
                </Button>
              ) : (
                <>
                  <Button variant="destructive" size="lg" onClick={handleDeleteSelectedItems} disabled={selectedIds.length === 0}>
                    Eliminar seleccionados ({selectedIds.length})
                  </Button>
                  <Button variant="ghost" size="lg" onClick={() => { setSelectionMode(false); setSelectedIds([]); }}>
                    Cancelar selección
                  </Button>
                  <Button variant="destructive" size="lg" onClick={handleDeleteAllItems}>
                    Eliminar todos
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-96 mx-auto bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="recent" className="rounded-lg">
              Recientes
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-lg">
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-lg">
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="archive" className="rounded-lg">
              Archivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {isLoading ? 'Cargando...' : showAllItems
                  ? `Todos los elementos (${topLevelItems.length})`
                  : `Elementos recientes (${topLevelItems.length})`}
              </h3>
              {!showAllItems && topLevelItems.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAllItems(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Ver todos los elementos
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-600">Cargando elementos del Codex...</span>
              </div>
            ) : topLevelItems.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay elementos</h3>
                <p className="text-slate-600 mb-4">
                  {codexItems.length === 0 
                    ? "Aún no has agregado elementos a tu Codex." 
                    : "No se encontraron elementos que coincidan con tu búsqueda."
                  }
                </p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer elemento
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {topLevelItems.map((item) => {
                  if (item.is_group_parent) {
                    return <CodexFolderCard 
                      key={item.id} 
                      item={item} 
                      onEdit={(group) => {
                        setGroupToEdit(group)
                        setIsEditGroupModalOpen(true)
                      }}
                      onDelete={() => handleDeleteGroup(item.group_id || item.id)}
                      onAddItem={() => handleOpenAddToGroupModal(item)}
                      onViewItem={handleViewItem}
                      onDownloadItem={handleDownloadItem}
                      onTranscribeItem={handleTranscribeItem}
                      onShowTranscription={handleShowTranscription}
                      onEditItem={handleEditItem}
                      selectionMode={selectionMode}
                      selectedIds={selectedIds}
                      toggleSelectItem={toggleSelectItem}
                    />
                  } else {
                    const IconComponent = getTypeIcon(item.tipo)
                    return (
                      <Card key={item.id} className="relative bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden flex flex-col">
                        {selectionMode && (
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                            className="absolute top-2 left-2 z-20 bg-white rounded"
                          />
                        )}
                        <CardHeader className="p-4 border-b border-slate-200">
                          {/* Title and menu in the same row */}
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <CardTitle className="text-lg font-semibold text-slate-900 truncate min-w-0" title={item.titulo}>
                              {item.titulo}
                            </CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="-mr-2 -mt-2 opacity-60 hover:opacity-100">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewItem(item)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                {(item.storage_path || item.url) && (
                                  <DropdownMenuItem onClick={() => handleDownloadItem(item)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar
                                  </DropdownMenuItem>
                                )}
                                {canTranscribe(item) && !item.audio_transcription && (
                                  <DropdownMenuItem 
                                    onClick={() => handleTranscribeItem(item)}
                                    disabled={isTranscribing}
                                  >
                                    <Mic className="h-4 w-4 mr-2" />
                                    {isTranscribing ? 'Transcribiendo...' : 'Transcribir'}
                                  </DropdownMenuItem>
                                )}
                                {item.audio_transcription && (
                                  <DropdownMenuItem onClick={() => handleShowTranscription(item)}>
                                    <Mic className="h-4 w-4 mr-2" />
                                    Transcripción
                                  </DropdownMenuItem>
                                )}
                                {canBeGrouped(item) && !item.group_id && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleOpenGroupModal(item)}>
                                      <FolderPlus className="h-4 w-4 mr-2" />
                                      Crear Grupo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenAddToGroupModal(item)}>
                                      <Users className="h-4 w-4 mr-2" />
                                      Agregar a Grupo
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {item.group_id && !item.is_group_parent && (
                                  <DropdownMenuItem onClick={() => handleRemoveFromGroup(item)} className="text-orange-600">
                                    <Users className="h-4 w-4 mr-2" />
                                    Remover del Grupo
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Compartir
                                </DropdownMenuItem>
                                {selectionMode && (
                                  <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelectItem(item.id)} className="mr-2" />
                                )}
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteItemConfirm(item)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {/* Icon and file size below title */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="bg-slate-100 p-2 rounded-lg flex-shrink-0">
                              <IconComponent className="h-5 w-5 text-slate-600" />
                            </div>
                            <CardDescription className="text-sm text-slate-500">
                              {formatFileSize(item.tamano)}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 capitalize">
                              {item.tipo}
                            </Badge>
                            {item.is_drive && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                Google Drive
                              </Badge>
                            )}
                            {item.is_group_parent && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                📁 Grupo: {item.group_name} ({item.total_parts} partes)
                              </Badge>
                            )}
                            {item.group_id && !item.is_group_parent && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                🔗 Parte {item.part_number}
                              </Badge>
                            )}
                            {item.audio_transcription && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 cursor-pointer" onClick={() => handleShowTranscription(item)}>
                                🎤 Transcripción
                              </Badge>
                            )}
                          </div>

                          {item.proyecto && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Folder className="h-4 w-4" />
                              <span className="truncate">{item.proyecto}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(item.fecha)}</span>
                          </div>

                          {item.etiquetas && item.etiquetas.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.etiquetas.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  {tag}
                                </Badge>
                              ))}
                              {item.etiquetas.length > 2 && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  +{item.etiquetas.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {item.descripcion && (
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {item.descripcion}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  }
                })}
              </div>
            )}

            {/* Load More / Show Less Section */}
            {(topLevelItems.length > itemsToShow && !showAllItems) && (
              <div className="flex flex-col items-center gap-4 pt-8 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-slate-600 mb-4">
                    Mostrando {itemsToShow} de {topLevelItems.length} elementos
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setItemsToShow((prev) => Math.min(prev + 6, topLevelItems.length))}
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      Cargar 6 más
                    </Button>
                    <Button
                      onClick={() => setShowAllItems(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Ver todos ({topLevelItems.length})
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {showAllItems && topLevelItems.length > 0 && (
               <div className="flex flex-col items-center gap-4 pt-8 border-t border-slate-200">
                  <p className="text-slate-600 mb-4">Mostrando todos los {topLevelItems.length} elementos</p>
                  <Button
                    onClick={() => {
                      setShowAllItems(false)
                      setItemsToShow(6)
                    }}
                    variant="outline"
                  >
                    Mostrar menos
                  </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects">
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Vista de Proyectos</h3>
              <p className="text-slate-600">Organiza tus fuentes por proyectos de investigación</p>
            </div>
          </TabsContent>

          <TabsContent value="favorites">
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Elementos Favoritos</h3>
              <p className="text-slate-600">Acceso rápido a tus fuentes más importantes</p>
            </div>
          </TabsContent>

          <TabsContent value="archive">
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Archivo</h3>
              <p className="text-slate-600">Fuentes archivadas y materiales históricos</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Editar Elemento
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Modifica los metadatos de este elemento del Codex
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título *
              </label>
              <Input
                value={editForm.titulo}
                onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                placeholder="Título del elemento"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción
              </label>
              <textarea
                value={editForm.descripcion}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Proyecto *
              </label>
              <Select 
                value={editForm.proyecto} 
                onValueChange={(value) => setEditForm({ ...editForm, proyecto: value })}
              >
                <SelectTrigger className="border-slate-200 focus:border-blue-500">
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-proyecto">Sin proyecto</SelectItem>
                  {userProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campo URL - Solo para enlaces */}
            {editingItem?.tipo === 'enlace' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL del Enlace *
                </label>
                <Input
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  placeholder="https://ejemplo.com"
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  type="url"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Etiquetas
              </label>
              <Input
                value={editForm.etiquetas}
                onChange={(e) => setEditForm({ ...editForm, etiquetas: e.target.value })}
                placeholder="Etiquetas separadas por comas"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Separa las etiquetas con comas
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editForm.titulo.trim() || !editForm.proyecto || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Transcripción */}
      <Dialog open={!!transcriptionModalItem} onOpenChange={() => setTranscriptionModalItem(null)}>
        {transcriptionModalItem && (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-600" />
                Transcripción de "{transcriptionModalItem.titulo}"
              </DialogTitle>
              <DialogDescription>Vista de solo lectura</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto prose">
              {transcriptionModalItem.audio_transcription?.split('\n').map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={() => setTranscriptionModalItem(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal para Crear Grupo */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-blue-600" />
              Crear Nuevo Grupo
            </DialogTitle>
            <DialogDescription>
              Convierte este elemento en el contenedor principal de un grupo de partes relacionadas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Grupo *
              </label>
              <Input
                value={groupForm.group_name}
                onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
                placeholder="ej: Entrevista con Alcalde - Serie completa"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción del Grupo
              </label>
              <Textarea
                value={groupForm.group_description}
                onChange={(e) => setGroupForm({ ...groupForm, group_description: e.target.value })}
                placeholder="Describe el contenido del grupo y la relación entre las partes"
                rows={3}
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>

            {selectedItemForGroup && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Elemento Principal:</h4>
                <p className="text-sm text-blue-800">{selectedItemForGroup.titulo}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Este será el contenedor principal del grupo
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsGroupModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => selectedItemForGroup && handleCreateGroup(selectedItemForGroup)}
              disabled={!groupForm.group_name.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Grupo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Agregar a Grupo Existente */}
      <Dialog open={showAddToGroupModal} onOpenChange={setShowAddToGroupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Agregar a Grupo Existente
            </DialogTitle>
            <DialogDescription>
              Selecciona un grupo existente y el número de parte para este elemento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Grupo Existente *
              </label>
              <Select
                value={selectedGroup}
                onValueChange={(value) => {
                  setSelectedGroup(value)
                  // Establecer número de parte sugerido automáticamente = total_parts + 1
                  const grp = availableGroups.find(g => (g.group_id || g.id) === value)
                  if (grp) {
                    setPartNumber((grp.total_parts || 0) + 1)
                  }
                }}
              >
                <SelectTrigger className="border-slate-200 focus:border-blue-500">
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((group) => (
                    <SelectItem key={group.id} value={group.group_id || group.id}>
                      {group.group_name} ({group.total_parts ?? 0} partes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableGroups.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  No hay grupos disponibles. Crea uno primero.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número de Parte *
              </label>
              <Input
                type="number"
                min="1"
                value={partNumber}
                onChange={(e) => setPartNumber(parseInt(e.target.value) || 1)}
                placeholder="1"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Número que identifica esta parte dentro del grupo
              </p>
            </div>

            {selectedItemForGroup && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Elemento a Agregar:</h4>
                <p className="text-sm text-purple-800">{selectedItemForGroup.titulo}</p>
                <p className="text-xs text-purple-600 mt-1">
                  Se agregará como parte {partNumber} del grupo seleccionado
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddToGroupModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddToGroup}
              disabled={!selectedGroup || !partNumber || isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                'Agregar al Grupo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Grupo */}
      <Dialog open={isEditGroupModalOpen} onOpenChange={setIsEditGroupModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Editar Grupo
            </DialogTitle>
            <DialogDescription>
              Modifica el nombre y la descripción del grupo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Grupo *
              </label>
              <Input
                value={groupToEdit?.group_name || ''}
                onChange={e => setGroupToEdit(g => g ? { ...g, group_name: e.target.value } : g)}
                placeholder="ej: Entrevista con Alcalde - Serie completa"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción del Grupo
              </label>
              <Textarea
                value={groupToEdit?.group_description || ''}
                onChange={e => setGroupToEdit(g => g ? { ...g, group_description: e.target.value } : g)}
                placeholder="Describe el contenido del grupo y la relación entre las partes"
                rows={3}
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditGroupModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!groupToEdit) return;
                await updateGroupInfo(groupToEdit.group_id || groupToEdit.id, groupToEdit.user_id, {
                  group_name: groupToEdit.group_name,
                  group_description: groupToEdit.group_description
                })
                setIsEditGroupModalOpen(false)
                setGroupToEdit(null)
                await loadCodexData()
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!groupToEdit?.group_name?.trim()}
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
} 