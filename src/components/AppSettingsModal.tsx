import React, { useState } from "react";
import {
  X,
  Settings,
  Info,
  Laptop2,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Database,
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { useStore } from "../lib/store";
import { Button } from "./ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { SelectDropdown } from "./ui/Select";
import { DropdownOption } from "./ui/Dropdown";
import { Label } from "./ui/Label";
import { ThemeMode, ThemeColor } from "../types";
import { useTranslation } from "react-i18next";

const AppSettingsModal: React.FC = () => {
  const {
    themeMode,
    setThemeMode,
    themeColor,
    setThemeColor,
    setShowAppSettings,
    clearLogs,
    clearSystemLogs,
    presets,
    commands,
    sequences,
    geminiApiKey,
    setGeminiApiKey,
  } = useStore();

  const { t, i18n } = useTranslation();

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || "");

  const handleClearAllData = () => {
    if (confirm(t("settings.clear_confirm"))) {
      clearLogs();
      clearSystemLogs();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowAppSettings(false)}
    >
      <Card
        className="w-full max-w-lg shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t("settings.title")}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAppSettings(false)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6 space-y-8">
          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4" /> {t("settings.appearance")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("settings.language")}</Label>
                <div className="flex gap-2 p-1 bg-muted rounded-lg border border-border">
                  <button
                    onClick={() => i18n.changeLanguage("en")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${i18n.language === "en" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage("zh")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${i18n.language === "zh" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    中文
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.theme")}</Label>
                <div className="flex gap-2 p-1 bg-muted rounded-lg border border-border">
                  {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setThemeMode(mode)}
                      className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${themeMode === mode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      title={mode}
                    >
                      {mode === "light" && <Sun className="w-3.5 h-3.5" />}
                      {mode === "dark" && <Moon className="w-3.5 h-3.5" />}
                      {mode === "system" && <Laptop2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>{t("settings.accent")}</Label>
                <SelectDropdown
                  options={
                    [
                      { value: "zinc", label: "Zinc (Neutral)" },
                      { value: "blue", label: "Blue" },
                      { value: "green", label: "Green" },
                      { value: "orange", label: "Orange" },
                      { value: "rose", label: "Rose" },
                      { value: "yellow", label: "Yellow" },
                    ] as DropdownOption<ThemeColor>[]
                  }
                  value={themeColor}
                  onChange={(value) => setThemeColor(value)}
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Settings
            </h3>
            <div className="bg-muted/20 p-4 rounded-lg border border-border space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Gemini API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter your Gemini API key..."
                      className="w-full h-9 px-3 pr-10 text-xs font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setGeminiApiKey(apiKeyInput)}
                    disabled={apiKeyInput === geminiApiKey}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {geminiApiKey ? (
                    <span className="text-green-600 dark:text-green-400">
                      API key configured
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      No API key configured
                    </span>
                  )}
                </p>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Get a free API key from Google AI Studio
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4" /> {t("settings.data")}
            </h3>
            <div className="bg-muted/20 p-4 rounded-lg border border-border space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>{t("settings.data.presets")}</span>
                <span className="font-mono font-bold">{presets.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>{t("settings.data.commands")}</span>
                <span className="font-mono font-bold">{commands.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>{t("settings.data.sequences")}</span>
                <span className="font-mono font-bold">{sequences.length}</span>
              </div>
              <div className="h-px bg-border/50 my-2"></div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleClearAllData}
              >
                <Trash2 className="w-4 h-4 mr-2" /> {t("settings.clear_logs")}
              </Button>
            </div>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" /> {t("settings.about")}
            </h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>SerialMan AI</strong> v1.2.0
              </p>
              <p>{t("settings.about.desc")}</p>
              <p className="opacity-70 mt-2">
                Built with React, Web Serial API, and Google Gemini.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSettingsModal;
