import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(
        (s) =>
          s.key.toLowerCase() === event.key.toLowerCase() &&
          (s.ctrlKey === undefined || s.ctrlKey === (event.ctrlKey || event.metaKey)) &&
          (s.shiftKey === undefined || s.shiftKey === event.shiftKey) &&
          (s.altKey === undefined || s.altKey === event.altKey)
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    // Show shortcuts help with ?
    const handleHelpKey = (event: KeyboardEvent) => {
      if (event.key === "?" && event.shiftKey) {
        event.preventDefault();
        showShortcutsHelp();
      }
    };

    const showShortcutsHelp = () => {
      const shortcutsList = shortcuts
        .map((s) => {
          const modifiers = [
            s.ctrlKey ? "Ctrl" : "",
            s.shiftKey ? "Shift" : "",
            s.altKey ? "Alt" : "",
          ]
            .filter(Boolean)
            .join("+");
          const key = s.key === " " ? "Space" : s.key.toUpperCase();
          const combo = modifiers ? `${modifiers}+${key}` : key;
          return `${combo}: ${s.description}`;
        })
        .join("\n");

      toast({
        title: "⌨️ Keyboard Shortcuts",
        description: (
          <pre className="text-xs whitespace-pre-wrap font-mono mt-2">
            {shortcutsList}
            {"\n"}
            Shift+?: Show this help
          </pre>
        ),
        duration: 10000,
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleHelpKey);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleHelpKey);
    };
  }, [shortcuts, enabled, toast]);
}
