// src/components/OfflineModal.tsx
import { Icon } from '@iconify/react';
export default function OfflineModal() {
  

  return (
  <div className="modal modal-open bg-black/40 backdrop-blur-sm">
    <div className="bg-white p-8 rounded-lg max-w-md">
      {/* Gradient top bar */}
      <div className="h-1 bg-error mb-8" />

      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-error rounded-full p-4">
          <Icon
            icon="material-symbols:cloud-off"
            className="w-8 h-8 text-white"
          />
        </div>
      </div>

      {/* Header */}
      <h2 className="text-2xl font-bold text-avit-grey-80 text-center mb-3">
        System Offline
      </h2>

      {/* Message */}
      <p className="text-avit-grey-80 text-center">
        Unable to connect to the server. Please check back shortly.
      </p>
    </div>
  </div>
  );
}
