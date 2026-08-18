import { useEffect, useRef, useState } from "react";

function UploadSection({ car, formData, setFormData }) {
  const certificateInputRef = useRef(null);
  const imagesInputRef = useRef(null);
  const [brokenImageIds, setBrokenImageIds] = useState([]);

  // Reset certificate file input when form state is cleared
  useEffect(() => {
    if (
      formData.possession_certificate === null &&
      certificateInputRef.current
    ) {
      certificateInputRef.current.value = "";
    }
  }, [formData.possession_certificate]);

  // Reset vehicle images file input when form state is cleared
  useEffect(() => {
    if (
      formData.images.length === 0 &&
      imagesInputRef.current
    ) {
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
      <h2 className="text-lg font-semibold text-gray-900">
        Upload Files
      </h2>

      {/* Current Certificate */}
      {car?.possession_certificate &&
        !formData.remove_certificate && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Current Certificate
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`${import.meta.env.VITE_URL}${car.possession_certificate}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Current Certificate
              </a>

              <button
                type="button"
                onClick={handleDeleteCertificate}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                Delete Certificate
              </button>
            </div>
          </div>
        )}

      {/* Certificate Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Possession Certificate
        </label>

        <input
          ref={certificateInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleCertificateChange}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />

        {formData.possession_certificate && (
          <p className="text-sm text-gray-600">
            Selected: {formData.possession_certificate.name}
          </p>
        )}

        {formData.remove_certificate && (
          <p className="text-sm font-medium text-red-600">
            Certificate will be deleted when you save the vehicle.
          </p>
        )}
      </div>

      {/* Vehicle Images */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Vehicle Images
        </label>

        <input
          ref={imagesInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImagesChange}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />

        {car?.images?.length > 0 && (
          <>
            <h3 className="pt-2 text-base font-semibold text-gray-800">
              Existing Images
            </h3>

            <div
              className="rounded-md border border-gray-200 bg-gray-50 p-4"
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {car.images.map((image) => (
                <div
                  key={image.id}
                  className="rounded-md bg-white p-2 shadow-sm"
                  style={{
                    textAlign: "center",
                  }}
                >
                  {brokenImageIds.includes(image.id) ? (
                    <div
                      className="rounded-md"
                      style={{
                        width: "150px",
                        height: "100px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #ddd",
                        backgroundColor: "#f5f5f5",
                        color: "#777",
                        fontSize: "14px",
                        textAlign: "center",
                      }}
                    >
                      Image unavailable
                    </div>
                  ) : (
                    <img
                      src={`${import.meta.env.VITE_URL}${image.image}`}
                      alt="Vehicle"
                      width="150"
                      height="100"
                      className="rounded-md"
                      style={{
                        objectFit: "cover",
                      }}
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
                    <p className="mt-2 text-sm font-semibold text-green-700">
                      Cover Image
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {formData.images.length > 0 && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Selected Images
            </p>

            <ul className="space-y-1">
              {formData.images.map((image, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600"
                >
                  {image.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadSection;