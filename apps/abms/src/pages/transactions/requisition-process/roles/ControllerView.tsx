import { ApprovalRoleView, type ApprovalRoleViewProps } from './ApprovalRoleView';

export function ControllerView(props: Omit<ApprovalRoleViewProps, 'roleKey'>) {
    return <ApprovalRoleView {...props} roleKey="controller-access" />;
}
