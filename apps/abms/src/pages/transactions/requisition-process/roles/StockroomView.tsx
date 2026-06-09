import React from 'react';
import { Theme } from '../shared/types';
import { ROLES } from '../shared/constants';
import { RolePage } from '../shared/components/RolePage';

const ROLE = ROLES.find(r => r.key === 'stockroom-access')!;

interface StockroomViewProps {
    t: Theme;
    isDark: boolean;
    canSwitch: boolean;
    onSwitchRole: () => void;
}

export function StockroomView({ t, isDark, canSwitch, onSwitchRole }: StockroomViewProps) {
    return (
        <RolePage
            role={ROLE}
            t={t}
            isDark={isDark}
            canSwitch={canSwitch}
            onSwitchRole={onSwitchRole}
        />
        // TODO: pass children with real table + API wiring when ready
    );
}