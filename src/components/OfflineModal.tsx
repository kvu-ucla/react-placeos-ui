// src/components/OfflineModal.tsx

export default function OfflineModal() {
  

  return (
    <div className="modal modal-open bg-black/40">
      <div className="bg-white p-8 rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-avit-grey pb-8">
          <h2 className="text-4xl font-semibold">System</h2>
        </div>
        <p>System is offline</p>
      </div>
    </div>
  );
}
