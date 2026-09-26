import { useEffect, useRef, useState } from "react";

function UploadSection({ car, formData, setFormData, showImageUpload = true }) {
  const certificateInputRef = useRef(null);
  const imagesInputRef = useRef(null);
  const [brokenImageIds, setBrokenImageIds] = useState([]);

  useEffect(() => {
    if (
      formData.possession_certificate === null &&
      certificateInputRef.current
    ) {
      certificateInputRef.current.value = "";
    }
  }, [formData.possession_certificate]);

  useEffect(() => {
    if (formData.images.length === 0 && imagesInputRef.current) {
      imagesInputRef.current.value = "";
    }
  }, [formData.images]);

  useEffect(() => {
    setBrokenImageIds([]);
  }, [car?.id]);

  const handleCertificateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      possession_certificate: e.target.files[0] || null,
      remove_certificate: false,
    }));
  };

  const handleDeleteCertificate = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete the possession certificate?",
    );

    if (!confirmed) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      possession_certificate: null,
      remove_certificate: true,
    }));
  };

  const handleImagesChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      images: Array.from(e.target.files),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold tracking-tight text-slate-900">
          Upload Files
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Add documents and vehicle images.
        </p>
      </div>

      {car?.possession_certificate && !formData.remove_certificate && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            Current Certificate
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`${import.meta.env.VITE_URL}${car.possession_certificate}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-amber-600 hover:text-amber-700 hover:underline"
            >
              View Current Certificate
            </a>

            <button
              type="button"
              onClick={handleDeleteCertificate}
              className="rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
            >
              Delete Certificate
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
          Possession Certificate
        </label>

        <input
          ref={certificateInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleCertificateChange}
          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-700 hover:file:bg-amber-100"
        />

        {formData.possession_certificate && (
          <p className="text-sm text-slate-500">
            Selected:{" "}
            <span className="font-medium text-slate-700">
              {formData.possession_certificate.name}
            </span>
          </p>
        )}

        {formData.remove_certificate && (
          <p className="text-sm font-semibold text-rose-600">
            Certificate will be deleted when you save the vehicle.
          </p>
        )}
      </div>

      {showImageUpload && (
        <div className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            Vehicle Images
          </label>

          <input
            ref={imagesInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImagesChange}
            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-700 hover:file:bg-amber-100"
          />

          {car?.images?.length > 0 && (
            <>
              <h3 className="pt-2 text-sm font-bold text-slate-800">
                Existing Images
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {car.images.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
                  >
                    {brokenImageIds.includes(image.id) ? (
                      <div className="flex h-[120px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                        Image unavailable
                      </div>
                    ) : (
                      <img
                        src={`${import.meta.env.VITE_URL}${image.image}`}
                        alt="Vehicle"
                        width="150"
                        height="100"
                        className="h-[120px] w-full rounded-xl object-cover"
                        onError={() => {
                          setBrokenImageIds((prev) =>
                            prev.includes(image.id)
                              ? prev
                              : [...prev, image.id],
                          );
                        }}
                      />
                    )}

                    {image.is_cover && (
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                        Cover Image
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {formData.images.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Selected Images
              </p>

              <ul className="space-y-1.5">
                {formData.images.map((image, index) => (
                  <li
                    key={index}
                    className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600"
                  >
                    {image.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadSection;
