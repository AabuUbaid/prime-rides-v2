function UploadSection({ car, formData, setFormData }) {
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
    <div>
      <h2>Upload Files</h2>

      {/* Current Certificate */}
      {car?.possession_certificate && !formData.remove_certificate && (
        <div>
          <p>Current Certificate</p>

          <a
            href={`${import.meta.env.VITE_URL}${car.possession_certificate}`}
            target="_blank"
            rel="noreferrer"
          >
            View Current Certificate
          </a>

          <button
            type="button"
            onClick={handleDeleteCertificate}
            style={{ marginLeft: "10px" }}
          >
            Delete Certificate
          </button>
        </div>
      )}

      {/* Certificate Upload */}
      <div>
        <label>Possession Certificate</label>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleCertificateChange}
        />

        {formData.possession_certificate && (
          <p>{formData.possession_certificate.name}</p>
        )}

        {formData.remove_certificate && (
          <p>Certificate will be deleted when you save the vehicle.</p>
        )}
      </div>

      <br />

      {/* Vehicle Images */}
      <div>
        <label>Vehicle Images</label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImagesChange}
        />

        {car?.images?.length > 0 && (
          <>
            <h3>Existing Images</h3>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {car.images.map((image) => (
                <div
                  key={image.id}
                  style={{
                    textAlign: "center",
                  }}
                >
                  <img
                    src={`${import.meta.env.VITE_URL}${image.image}`}
                    alt="Vehicle"
                    width="150"
                  />

                  {image.is_cover && (
                    <p>
                      <strong>Cover Image</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {formData.images.length > 0 && (
          <ul>
            {formData.images.map((image, index) => (
              <li key={index}>{image.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default UploadSection;
