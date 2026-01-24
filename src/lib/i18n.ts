import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "app.title": "SerialMan AI",
      "status.connected": "Connected",
      "status.offline": "Offline",

      // Sidebar
      "sidebar.commands": "Cmds",
      "sidebar.sequences": "Seq",
      "sidebar.presets": "Config",
      "sidebar.library": "Library",
      "sidebar.no_commands": "No commands saved.\nClick + to add one.",
      "sidebar.new_command": "Add Command",
      "sidebar.settings": "Settings",
      "sidebar.logs": "System Logs",

      // Control Panel
      "cp.mode": "Mode",
      "cp.port": "Device Port",
      "cp.baud": "Baud Rate",
      "cp.connect": "CONNECT",
      "cp.disconnect": "DISCONNECT",
      "cp.open": "OPEN PORT",
      "cp.close": "CLOSE PORT",
      "cp.framing": "Framing",
      "cp.profile": "Profile",
      "cp.save_as": "Save As",
      "cp.custom": "Custom",
      "cp.signals": "Control Signals",
      "cp.buffer": "Buffer",

      // Modal Common
      "modal.save": "Save",
      "modal.cancel": "Cancel",
      "modal.delete": "Delete",
      "modal.confirm": "Confirm",
      "modal.close": "Close",

      // Command Editor
      "cmd.new": "New Command",
      "cmd.edit": "Edit Command",
      "cmd.name": "Command Name",
      "cmd.group": "Group / Device",
      "cmd.format": "Format",
      "cmd.encoding": "Encoding",
      "cmd.payload": "Static Payload",
      "cmd.desc": "Description",
      "cmd.tab.basic": "Basic Info",
      "cmd.tab.params": "Parameters",
      "cmd.tab.validation": "Validation",
      "cmd.tab.scripting": "Scripting",
      "cmd.tab.processing": "Scripting",
      "cmd.tab.framing": "Framing",
      "cmd.tab.context": "Context",
      "cmd.tab.wizard": "Wizard",

      // Processing Tab
      "proc.pre_req": "Pre-Request Script",
      "proc.pre_req_desc": "Modify payload dynamically before sending.",
      "proc.response": "Post-Response Handling",
      "proc.response_desc": "Validate response and extract variables.",
      "proc.pattern": "Simple Pattern",
      "proc.script": "Advanced Script",
      "proc.timeout": "Timeout (ms)",

      // Settings
      "settings.title": "Application Settings",
      "settings.appearance": "Appearance",
      "settings.language": "Language",
      "settings.theme": "Theme",
      "settings.accent": "Accent Color",
      "settings.data": "Data Management",
      "settings.data.presets": "Saved Presets",
      "settings.data.commands": "Saved Commands",
      "settings.data.sequences": "Saved Sequences",
      "settings.clear_logs": "Clear All Logs",
      "settings.about": "About",
      "settings.about.desc":
        "A web-based tool for serial communication, debugging, and protocol analysis enhanced with Generative AI.",
      "settings.clear_confirm":
        "Are you sure you want to clear ALL logs (Data and System)? This cannot be undone.",

      // Dashboard
      "dash.title": "Live Telemetry",
      "dash.add": "Add Widget",
      "dash.clear": "Clear All",
      "dash.empty": "Telemetry Dashboard",
      "dash.empty_desc":
        "No widgets defined. Variables from scripts will auto-create widgets, or you can add them manually.",

      // Notifications
      "toast.connected": "Connected",
      "toast.disconnected": "Disconnected",
      "toast.error": "Error",
      "toast.success": "Success",
      "toast.saved": "Saved",
      "toast.deleted": "Deleted",
    },
  },
  zh: {
    translation: {
      "app.title": "串口助手 AI",
      "status.connected": "已连接",
      "status.offline": "离线",

      // Sidebar
      "sidebar.commands": "指令",
      "sidebar.sequences": "序列",
      "sidebar.presets": "配置",
      "sidebar.library": "指令库",
      "sidebar.no_commands": "暂无指令。\n点击 + 新建。",
      "sidebar.new_command": "新建指令",
      "sidebar.settings": "设置",
      "sidebar.logs": "系统日志",

      // Control Panel
      "cp.mode": "模式",
      "cp.port": "端口",
      "cp.baud": "波特率",
      "cp.connect": "连接",
      "cp.disconnect": "断开",
      "cp.open": "打开串口",
      "cp.close": "关闭串口",
      "cp.framing": "分帧",
      "cp.profile": "预设文件",
      "cp.save_as": "另存为",
      "cp.custom": "自定义",
      "cp.signals": "控制信号",
      "cp.buffer": "缓冲区",

      // Modal Common
      "modal.save": "保存",
      "modal.cancel": "取消",
      "modal.delete": "删除",
      "modal.confirm": "确认",
      "modal.close": "关闭",

      // Command Editor
      "cmd.new": "新建指令",
      "cmd.edit": "编辑指令",
      "cmd.name": "指令名称",
      "cmd.group": "分组 (设备)",
      "cmd.format": "格式",
      "cmd.encoding": "编码",
      "cmd.payload": "静态载荷",
      "cmd.desc": "描述",
      "cmd.tab.basic": "基础信息",
      "cmd.tab.params": "参数",
      "cmd.tab.validation": "验证",
      "cmd.tab.scripting": "脚本",
      "cmd.tab.processing": "脚本处理",
      "cmd.tab.framing": "分帧",
      "cmd.tab.context": "上下文",
      "cmd.tab.wizard": "向导",

      // Processing Tab
      "proc.pre_req": "预处理脚本",
      "proc.pre_req_desc": "在发送前动态修改载荷。",
      "proc.response": "响应处理",
      "proc.response_desc": "验证响应并提取变量。",
      "proc.pattern": "简单匹配",
      "proc.script": "高级脚本",
      "proc.timeout": "超时 (ms)",

      // Settings
      "settings.title": "应用设置",
      "settings.appearance": "外观",
      "settings.language": "语言",
      "settings.theme": "主题",
      "settings.accent": "强调色",
      "settings.data": "数据管理",
      "settings.data.presets": "已存预设",
      "settings.data.commands": "已存指令",
      "settings.data.sequences": "已存序列",
      "settings.clear_logs": "清空日志",
      "settings.about": "关于",
      "settings.about.desc":
        "基于 Web Serial API 和 Generative AI 构建的串口调试与协议分析工具。",
      "settings.clear_confirm":
        "确定要清空所有数据和系统日志吗？此操作不可撤销。",

      // Dashboard
      "dash.title": "实时遥测",
      "dash.add": "添加组件",
      "dash.clear": "清空所有",
      "dash.empty": "遥测仪表盘",
      "dash.empty_desc":
        "暂无组件。通过脚本提取的变量将自动显示，您也可以手动添加。",

      // Notifications
      "toast.connected": "已连接",
      "toast.disconnected": "已断开",
      "toast.error": "错误",
      "toast.success": "成功",
      "toast.saved": "已保存",
      "toast.deleted": "已删除",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React is safe from XSS
  },
});

export default i18n;
