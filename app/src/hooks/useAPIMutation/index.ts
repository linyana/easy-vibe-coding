import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { callEden, type EdenCall } from '@/libs/api';
import type { UseAPIError } from '@/libs/error';
import { queryClient } from '@/libs/queryClient';

export interface UseAPIMutationOptions<TVariables, TData> {
	call: (variables: TVariables) => EdenCall<TData>;
	/** Cache namespace to invalidate on success; omit for writes that refresh nothing. */
	queryKey?: readonly unknown[];
	successMessage?: string;
	onSuccess?: (data: TData, variables: TVariables) => void;
	/** Override the default failure toast (e.g. an inline error surface). */
	onError?: (error: UseAPIError, variables: TVariables) => void;
}

export function useAPIMutation<TVariables = void, TData = unknown>({
	call,
	queryKey,
	successMessage,
	onSuccess,
	onError,
}: UseAPIMutationOptions<TVariables, TData>) {
	return useMutation<NonNullable<TData>, UseAPIError, TVariables>({
		mutationFn: (variables) => callEden(call(variables)),
		onSuccess: (data, variables) => {
			if (queryKey) {
				void queryClient.invalidateQueries({ queryKey });
			}
			if (successMessage) toast.success(successMessage);
			onSuccess?.(data, variables);
		},
		onError: (error, variables) => {
			if (onError) {
				onError(error, variables);
			} else {
				toast.error(error.message);
			}
		},
	});
}
