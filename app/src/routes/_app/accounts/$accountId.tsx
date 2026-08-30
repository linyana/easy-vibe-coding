// The param `accountId` is a URL string; the detail page coerces it to the API's numeric id.
import { createFileRoute } from '@tanstack/react-router';
import { AccountDetail } from '@/pages';

export const Route = createFileRoute('/_app/accounts/$accountId')({
	component: AccountDetail,
});
