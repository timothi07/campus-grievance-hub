import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "es" | "fr" | "de";

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    welcome: "Welcome",
    complaints: "Complaints",
    newComplaint: "New Complaint",
    profile: "Profile",
    settings: "Settings",
    signOut: "Sign Out",
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
  },
  es: {
    welcome: "Bienvenido",
    complaints: "Quejas",
    newComplaint: "Nueva Queja",
    profile: "Perfil",
    settings: "Ajustes",
    signOut: "Cerrar Sesión",
    submit: "Enviar",
    cancel: "Cancelar",
    save: "Guardar",
    delete: "Eliminar",
  },
  fr: {
    welcome: "Bienvenue",
    complaints: "Plaintes",
    newComplaint: "Nouvelle Plainte",
    profile: "Profil",
    settings: "Paramètres",
    signOut: "Se Déconnecter",
    submit: "Soumettre",
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
  },
  de: {
    welcome: "Willkommen",
    complaints: "Beschwerden",
    newComplaint: "Neue Beschwerde",
    profile: "Profil",
    settings: "Einstellungen",
    signOut: "Abmelden",
    submit: "Einreichen",
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
