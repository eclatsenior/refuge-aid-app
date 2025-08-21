import { useState } from "react";
import { Plus, Search, Star, Lock, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore, type Note } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

interface NotesPageProps {
  onNavigate: (path: string) => void;
}

export function NotesPage({ onNavigate }: NotesPageProps) {
  const { notes, addNote, updateNote, deleteNote, settings } = useAppStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateNote = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
    setIsEditing(true);
  };
  
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(true);
  };
  
  const handleSaveNote = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "El título de la nota es obligatorio",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedNote) {
      updateNote(selectedNote.id, { 
        title: title.trim(), 
        content: content.trim(),
        isEncrypted: true 
      });
      toast({
        title: "Nota actualizada",
        description: "Los cambios se han guardado de forma segura"
      });
    } else {
      addNote({ 
        title: title.trim(), 
        content: content.trim(), 
        isEncrypted: true,
        isStarred: false 
      });
      toast({
        title: "Nota creada",
        description: "Nueva nota guardada de forma cifrada"
      });
    }
    
    setIsEditing(false);
    setSelectedNote(null);
    setTitle("");
    setContent("");
  };
  
  const handleDeleteNote = (note: Note) => {
    if (confirm(`¿Seguro que deseas eliminar la nota "${note.title}"?`)) {
      deleteNote(note.id);
      toast({
        title: "Nota eliminada",
        description: "La nota ha sido borrada permanentemente"
      });
    }
  };
  
  const toggleStar = (note: Note) => {
    updateNote(note.id, { isStarred: !note.isStarred });
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (isEditing) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {selectedNote ? 'Editar Nota' : 'Nueva Nota'}
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setSelectedNote(null);
                setTitle("");
                setContent("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveNote}>
              Guardar
            </Button>
          </div>
        </header>
        
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Título de la nota..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>
          
          <div>
            <textarea
              placeholder="Escribe tu nota aquí... Todo el contenido se cifra localmente para tu privacidad."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] p-3 border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock size={16} />
            <span>Nota cifrada localmente</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {settings.isDiscreetMode ? 'Mis Notas' : 'Notas Privadas'}
          </h1>
          <Button onClick={handleCreateNote} size="sm" className="gap-2">
            <Plus size={16} />
            Nueva
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar en tus notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>
      
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay notas</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? "No se encontraron notas con ese término de búsqueda"
              : "Crea tu primera nota privada y cifrada"
            }
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateNote} className="gap-2">
              <Plus size={16} />
              Crear primera nota
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredNotes
            .sort((a, b) => {
              if (a.isStarred && !b.isStarred) return -1;
              if (!a.isStarred && b.isStarred) return 1;
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            })
            .map((note) => (
              <Card key={note.id} className="hover:shadow-soft transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base line-clamp-1 flex-1">
                      {note.title}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {note.isStarred && (
                        <Star className="h-4 w-4 fill-warning text-warning" />
                      )}
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(note.updatedAt)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {note.content || "Sin contenido"}
                  </p>
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStar(note)}
                      className="gap-2 text-xs"
                    >
                      <Star 
                        size={14} 
                        className={note.isStarred ? "fill-warning text-warning" : ""} 
                      />
                      {note.isStarred ? 'Quitar' : 'Marcar'}
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditNote(note)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}