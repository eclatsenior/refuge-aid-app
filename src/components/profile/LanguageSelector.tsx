import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ca', name: 'Català', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

export function LanguageSelector() {
  const { t, i18n } = useTranslation('profile');
  const { toast } = useToast();

  const handleLanguageChange = async (langCode: string) => {
    try {
      // Cambiar idioma en i18n
      await i18n.changeLanguage(langCode);
      
      // Guardar en la base de datos
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: langCode })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: t('profileUpdated'),
          description: `${t('language')}: ${languages.find(l => l.code === langCode)?.name}`
        });
      }
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: t('updateError'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Globe className="w-4 h-4" />
        {t('language')}
      </label>
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
