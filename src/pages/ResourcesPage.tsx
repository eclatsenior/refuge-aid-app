import { useState } from "react";
import { Phone, ExternalLink, Heart, MapPin, Search, Star, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface Resource {
  id: string;
  title: string;
  category: string;
  phone?: string;
  url?: string;
  region: string;
  description: string;
  isVerified: boolean;
  available24h: boolean;
}

const useResources = () => {
  const { t } = useTranslation('resources');
  
  return [
    {
      id: '1',
      title: t('resources.1.title'),
      category: 'emergencia',
      phone: '016',
      region: 'nacional',
      description: t('resources.1.description'),
      isVerified: true,
      available24h: true
    },
    {
      id: '2',
      title: t('resources.2.title'),
      category: 'emergencia',
      phone: '112',
      region: 'nacional',
      description: t('resources.2.description'),
      isVerified: true,
      available24h: true
    },
    {
      id: '3',
      title: t('resources.3.title'),
      category: 'apoyo',
      phone: '900202010',
      region: 'nacional',
      description: t('resources.3.description'),
      isVerified: true,
      available24h: true
    },
    {
      id: '4',
      title: t('resources.4.title'),
      category: 'informacion',
      url: 'https://violenciagenero.igualdad.gob.es/',
      region: 'nacional',
      description: t('resources.4.description'),
      isVerified: true,
      available24h: false
    },
    {
      id: '5',
      title: t('resources.5.title'),
      category: 'alojamiento',
      phone: '914804901',
      region: 'madrid',
      description: t('resources.5.description'),
      isVerified: true,
      available24h: false
    },
    {
      id: '6',
      title: t('resources.6.title'),
      category: 'apoyo',
      phone: '900900120',
      region: 'cataluña',
      description: t('resources.6.description'),
      isVerified: true,
      available24h: true
    },
    {
      id: '7',
      title: t('resources.7.title'),
      category: 'apoyo',
      phone: '900200999',
      region: 'andalucia',
      description: t('resources.7.description'),
      isVerified: true,
      available24h: false
    }
  ];
};

const useCategories = () => {
  const { t } = useTranslation('resources');
  return [
    { value: 'todos', label: t('categories.all') },
    { value: 'emergencia', label: t('categories.emergency') },
    { value: 'apoyo', label: t('categories.support') },
    { value: 'alojamiento', label: t('categories.housing') },
    { value: 'informacion', label: t('categories.information') }
  ];
};

const useRegions = () => {
  const { t } = useTranslation('resources');
  return [
    { value: 'todas', label: t('regions.all') },
    { value: 'nacional', label: t('regions.national') },
    { value: 'madrid', label: t('regions.madrid') },
    { value: 'cataluña', label: t('regions.cataluña') },
    { value: 'andalucia', label: t('regions.andalucia') },
    { value: 'valencia', label: t('regions.valencia') },
    { value: 'galicia', label: t('regions.galicia') },
    { value: 'pais-vasco', label: t('regions.pais-vasco') }
  ];
};

export function ResourcesPage() {
  const { t } = useTranslation('resources');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedRegion, setSelectedRegion] = useState("todas");
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  
  const resources = useResources();
  const categories = useCategories();
  const regions = useRegions();
  
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || resource.category === selectedCategory;
    const matchesRegion = selectedRegion === 'todas' || resource.region === selectedRegion;
    
    return matchesSearch && matchesCategory && matchesRegion;
  });
  
  const handleCall = (phone: string, title: string) => {
    if (confirm(`${t('toast.callConfirm', { title })}\n${t('toast.callNumber', { phone })}`)) {
      window.open(`tel:${phone}`);
      toast({
        title: t('toast.calling'),
        description: t('toast.callingDescription', { phone })
      });
    }
  };
  
  const handleOpenUrl = (url: string, title: string) => {
    window.open(url, '_blank');
    toast({
      title: t('toast.openingLink'),
      description: t('toast.accessingDescription', { title })
    });
  };
  
  const handleCopyInfo = (resource: Resource) => {
    const info = `${resource.title}\n${resource.phone ? `Tel: ${resource.phone}\n` : ''}${resource.url ? `Web: ${resource.url}\n` : ''}${resource.description}`;
    navigator.clipboard.writeText(info);
    toast({
      title: t('toast.copied'),
      description: t('toast.copiedDescription')
    });
  };
  
  const toggleFavorite = (resourceId: string) => {
    setFavorites(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'emergencia':
        return 'bg-emergency/10 text-emergency border-emergency/20';
      case 'apoyo':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'alojamiento':
        return 'bg-safe/10 text-safe border-safe/20';
      case 'informacion':
        return 'bg-accent/10 text-accent-foreground border-accent/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.label || category;
  };
  
  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </header>
      
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.category')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.region')} />
            </SelectTrigger>
            <SelectContent>
              {regions.map(region => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
          <p className="text-muted-foreground">
            {t('empty.description')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResources
            .sort((a, b) => {
              // Emergency resources first, then favorites, then by verification status
              if (a.category === 'emergencia' && b.category !== 'emergencia') return -1;
              if (a.category !== 'emergencia' && b.category === 'emergencia') return 1;
              if (favorites.includes(a.id) && !favorites.includes(b.id)) return -1;
              if (!favorites.includes(a.id) && favorites.includes(b.id)) return 1;
              if (a.isVerified && !b.isVerified) return -1;
              if (!a.isVerified && b.isVerified) return 1;
              return a.title.localeCompare(b.title);
            })
            .map((resource) => (
              <Card 
                key={resource.id} 
                className={`hover:shadow-soft transition-shadow ${
                  resource.category === 'emergencia' ? 'border-emergency/30 bg-emergency/5' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-base line-clamp-2">
                          {resource.title}
                        </CardTitle>
                        {resource.isVerified && (
                          <Badge variant="secondary" className="text-xs bg-safe/10 text-safe border-safe/20">
                            ✓ {t('badges.verified')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${getCategoryColor(resource.category)}`}>
                          {getCategoryLabel(resource.category)}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs capitalize">
                          {resource.region}
                        </Badge>
                        
                        {resource.available24h && (
                          <Badge variant="secondary" className="text-xs">
                            {t('badges.24h')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(resource.id)}
                      className={favorites.includes(resource.id) ? 'text-warning' : 'text-muted-foreground'}
                    >
                      <Star 
                        size={16} 
                        className={favorites.includes(resource.id) ? 'fill-current' : ''} 
                      />
                    </Button>
                  </div>
                  
                  <CardDescription className="leading-relaxed">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex gap-2 flex-wrap">
                    {resource.phone && (
                      <Button
                        onClick={() => handleCall(resource.phone!, resource.title)}
                        size="sm"
                        className={resource.category === 'emergencia' 
                          ? 'bg-emergency hover:bg-emergency/90 text-emergency-foreground' 
                          : ''
                        }
                      >
                        <Phone size={14} className="mr-1" />
                        {resource.phone}
                      </Button>
                    )}
                    
                    {resource.url && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenUrl(resource.url!, resource.title)}
                        size="sm"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        {t('buttons.web')}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      onClick={() => handleCopyInfo(resource)}
                      size="sm"
                    >
                      <Copy size={14} className="mr-1" />
                      {t('buttons.copy')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">{t('reminder.title')}</p>
            <p 
              className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: t('reminder.description') }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}