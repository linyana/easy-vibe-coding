// The param `userId` is a URL string; the detail page coerces it to the API's numeric id.
import { createFileRoute } from '@tanstack/react-router';
import { UserDetail } from '@/pages';

export const Route = createFileRoute('/_app/users/$userId')({
	component: UserDetail,
});
