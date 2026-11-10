'use client';

import {useAuth} from '@workos-inc/authkit-nextjs/components';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Button} from '@astryxdesign/core/Button';
import {DropdownMenu} from '@astryxdesign/core/DropdownMenu';

/** The signed-in person's avatar, with their email and a way to sign out. */
export function AccountMenu() {
  const {user, loading, signOut} = useAuth();
  if (loading || !user) return null;

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <DropdownMenu
      alignment="end"
      menuWidth={240}
      items={[
        {
          type: 'section',
          title: user.email,
          items: [{label: 'Sign out', onClick: () => void signOut({returnTo: `${window.location.origin}/`})}],
        },
      ]}
      renderTrigger={props => (
        <Button
          {...props}
          label="Account"
          tooltip={user.email}
          variant="ghost"
          size="sm"
          isIconOnly
          icon={<Avatar size="sm" name={name} src={user.profilePictureUrl ?? undefined} tooltip={false} />}
        />
      )}
    />
  );
}
