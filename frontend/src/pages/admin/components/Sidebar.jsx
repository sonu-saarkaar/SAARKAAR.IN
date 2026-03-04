import React from 'react'
import {
    LayoutDashboard, Users, MessageSquareText, FileText, Layers,
    MonitorSmartphone, Image as ImageIcon, Activity, Wrench, Cpu,
    LineChart, Shield, ListTree, Settings, LogOut
} from 'lucide-react'
import BrandLogo from '../../../components/BrandLogo'

const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'history', label: 'Chat History', icon: MessageSquareText },
    { id: 'resumes', label: 'Resume Requests', icon: FileText },
    { id: 'portfolio', label: 'Projects Manager', icon: Layers },
    { id: 'content', label: 'Content Manager', icon: MonitorSmartphone },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'health', label: 'System Status', icon: Activity },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'ai', label: 'AI Configuration', icon: Cpu },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'audit', label: 'Audit Logs', icon: ListTree },
    { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
    return (
        <div className="admin-sidebar">
            <div className="sidebar-header">
                <div className="brand-logo-container">
                    <BrandLogo size="sm" showWordmark={false} />
                </div>
                <div>
                    <div className="admin-org">SAARKAAR INC.</div>
                    <div className="admin-badge">Admin Gateway</div>
                </div>
            </div>

            <div className="sidebar-scroll">
                <ul className="sidebar-menu">
                    {menuItems.map(item => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                            <li key={item.id}>
                                <button
                                    className={`menu-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveTab(item.id)}
                                >
                                    <Icon className="menu-icon" size={18} />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>

            <div className="sidebar-footer">
                <button className="menu-btn danger-outline" onClick={onLogout}>
                    <LogOut className="menu-icon" size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}
