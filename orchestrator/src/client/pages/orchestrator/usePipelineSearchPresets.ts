import * as api from "@client/api";
import i18n from "@client/i18n";
import { showErrorToast } from "@client/lib/error-toast";
import { queryKeys } from "@client/lib/queryKeys";
import type {
  CreatePipelineSearchPresetInput,
  PipelineSearchPreset,
  UpdatePipelineSearchPresetInput,
} from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

interface UsePipelineSearchPresetsArgs {
  enabled: boolean;
}

export interface PipelineSearchPresetComposerProps {
  savedSearches: PipelineSearchPreset[];
  isSavedSearchesLoading: boolean;
  onCreateSavedSearch: (
    input: CreatePipelineSearchPresetInput,
  ) => Promise<PipelineSearchPreset>;
  onUpdateSavedSearch: (
    id: string,
    input: UpdatePipelineSearchPresetInput,
  ) => Promise<PipelineSearchPreset>;
  onDeleteSavedSearch: (id: string) => Promise<void>;
  onApplySavedSearch: (preset: PipelineSearchPreset) => Promise<void>;
}

export function usePipelineSearchPresets({
  enabled,
}: UsePipelineSearchPresetsArgs): PipelineSearchPresetComposerProps {
  const queryClient = useQueryClient();

  const savedSearchesQuery = useQuery({
    queryKey: queryKeys.pipeline.searchPresets(),
    queryFn: api.getPipelineSearchPresets,
    enabled,
    staleTime: 30_000,
  });

  const createSavedSearchMutation = useMutation({
    mutationFn: api.createPipelineSearchPreset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pipeline.searchPresets(),
      });
      toast.success(i18n.t("pipeline:savedSearches.toasts.created"));
    },
    onError: (error) => {
      showErrorToast(
        error,
        i18n.t("pipeline:savedSearches.toasts.createFailed"),
      );
    },
  });

  const updateSavedSearchMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePipelineSearchPresetInput;
    }) => api.updatePipelineSearchPreset(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pipeline.searchPresets(),
      });
      toast.success(i18n.t("pipeline:savedSearches.toasts.updated"));
    },
    onError: (error) => {
      showErrorToast(
        error,
        i18n.t("pipeline:savedSearches.toasts.updateFailed"),
      );
    },
  });

  const deleteSavedSearchMutation = useMutation({
    mutationFn: api.deletePipelineSearchPreset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pipeline.searchPresets(),
      });
      toast.success(i18n.t("pipeline:savedSearches.toasts.deleted"));
    },
    onError: (error) => {
      showErrorToast(
        error,
        i18n.t("pipeline:savedSearches.toasts.deleteFailed"),
      );
    },
  });

  const markSavedSearchUsedMutation = useMutation({
    mutationFn: api.markPipelineSearchPresetUsed,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pipeline.searchPresets(),
      });
    },
  });

  const onCreateSavedSearch = useCallback(
    (input: CreatePipelineSearchPresetInput) =>
      createSavedSearchMutation.mutateAsync(input),
    [createSavedSearchMutation],
  );

  const onUpdateSavedSearch = useCallback(
    (id: string, input: UpdatePipelineSearchPresetInput) =>
      updateSavedSearchMutation.mutateAsync({ id, input }),
    [updateSavedSearchMutation],
  );

  const onDeleteSavedSearch = useCallback(
    (id: string) =>
      deleteSavedSearchMutation.mutateAsync(id).then(() => undefined),
    [deleteSavedSearchMutation],
  );

  const onApplySavedSearch = useCallback(
    (preset: PipelineSearchPreset) =>
      markSavedSearchUsedMutation.mutateAsync(preset.id).then(() => undefined),
    [markSavedSearchUsedMutation],
  );

  return {
    savedSearches: savedSearchesQuery.data?.searches ?? [],
    isSavedSearchesLoading: savedSearchesQuery.isFetching,
    onCreateSavedSearch,
    onUpdateSavedSearch,
    onDeleteSavedSearch,
    onApplySavedSearch,
  };
}
