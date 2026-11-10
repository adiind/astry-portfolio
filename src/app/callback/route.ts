import {handleAuth} from '@workos-inc/authkit-nextjs';

// Used only when no remembered path came back with the user.
export const GET = handleAuth({returnPathname: '/studio'});
