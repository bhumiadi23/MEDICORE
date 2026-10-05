import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getRoleConfigForAddress, ALL_ROLES_LIST } from '../config/roles';

export const useRole = () => {
  const { account, entityInfo } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeRoleConfig, setActiveRoleConfig] = useState(() => {
    return getRoleConfigForAddress(account, entityInfo?.role);
  });

  useEffect(() => {
    const config = getRoleConfigForAddress(account, entityInfo?.role);
    setActiveRoleConfig(config);
  }, [account, entityInfo]);

  const switchRole = (targetRoleKey) => {
    const target = ALL_ROLES_LIST.find(r => r.role === targetRoleKey);
    if (target) {
      setActiveRoleConfig({
        ...target,
        badgeColor: target.color,
        isMapped: true
      });
      navigate(target.path);
    }
  };

  return {
    currentRole: activeRoleConfig?.role || 'manufacturer',
    roleConfig: activeRoleConfig,
    allRoles: ALL_ROLES_LIST,
    switchRole,
    isDefault: activeRoleConfig?.isDefault || false
  };
};

export default useRole;
