import React, { useState } from 'react';
import { Theme } from '../types';
import { ROLES, PermissionKey } from '../constants';

interface RolePickerModalProps {
    matched: typeof ROLES[number][];
    onConfirm: (key: PermissionKey) => void;
    t: Theme;
    isDark: boolean;
}

export function RolePickerModal({ matched, onConfirm, t, isDark }: RolePickerModalProps) {
    const [selected, setSelected] = useState<PermissionKey | null>(null);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <div
                style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    boxShadow: t.cardShadow,
                    borderRadius: 16,
                    padding: '28px 28px 24px',
                    width: '100%',
                    maxWidth: 380,
                }}
            >
                <p style={{ fontSize: 13, fontWeight: 700, color: t.titleColor, marginBottom: 4 }}>
                    Select your role
                </p>
                <p style={{ fontSize: 11, color: t.cellMuted, marginBottom: 20 }}>
                    You have access to multiple areas. Choose which one to open.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {matched.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selected === role.key;
                        return (
                            <button
                                key={role.key}
                                onClick={() => setSelected(role.key)}
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: 10,
                                    border: `1px solid ${isSelected ? t.accentColor : t.cardBorder}`,
                                    background: isSelected ? t.dropdownSelected : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all .14s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <Icon style={{ width: 15, height: 15, color: isSelected ? t.accentColor : t.cellMuted, flexShrink: 0 }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? t.cellText : t.cellMuted }}>
                                    {role.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <button
                    disabled={!selected}
                    onClick={() => selected && onConfirm(selected)}
                    style={{
                        marginTop: 20,
                        width: '100%',
                        padding: '9px 0',
                        borderRadius: 9,
                        fontSize: 12,
                        fontWeight: 700,
                        border: `1px solid ${selected ? t.btnRefresh.border : t.cardBorder}`,
                        background: selected ? t.btnRefresh.bg : 'transparent',
                        color: selected ? t.btnRefresh.text : t.cellMuted,
                        cursor: selected ? 'pointer' : 'not-allowed',
                        opacity: selected ? 1 : 0.45,
                        transition: 'all .14s ease',
                    }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}