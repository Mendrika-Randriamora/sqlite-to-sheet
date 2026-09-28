import { useEffect, useRef, useState } from "react";

// Dans main.jsx : import "bootstrap/dist/css/bootstrap.min.css";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} Mo`;
  return `${(bytes / 1024 ** 3).toFixed(2)} Go`;
}

// Récupère le nom du fichier renvoyé par le serveur (en-tête Content-Disposition)
function filenameFromHeader(header) {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) return decodeURIComponent(utf8[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : null;
}

function triggerDownload(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Props :
 *  - url          : endpoint qui reçoit la base SQLite et renvoie le fichier Excel
 *  - fieldName    : nom du champ attendu côté serveur
 *  - maxSizeMb    : taille max en Mo (2048 = 2 Go)
 *  - accept       : extensions acceptées
 *  - autoDownload : lance le téléchargement dès que la conversion est finie
 */
export default function FileUpload({
  url = "http://localhost:8000/convert",
  fieldName = "file",
  maxSizeMb = 2048,
  accept = ".sqlite,.sqlite3,.db",
  autoDownload = true,
}) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  // idle | uploading | converting | success | error
  const [status, setStatus] = useState({ type: "idle" });
  const [result, setResult] = useState(null); // { url, name }
  const inputRef = useRef(null);
  const xhrRef = useRef(null);

  const busy = status.type === "uploading" || status.type === "converting";

  // Libère l'URL du blob quand elle change ou quand le composant disparaît
  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const handleChange = (e) => {
    const selected = e.target.files?.[0] ?? null;
    setProgress(0);
    setResult(null);

    if (selected && selected.size > maxSizeMb * 1024 * 1024) {
      setFile(null);
      setStatus({
        type: "error",
        message: `Le fichier (${formatSize(selected.size)}) dépasse la limite de ${formatSize(
          maxSizeMb * 1024 * 1024
        )}.`,
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFile(selected);
    setStatus({ type: "idle" });
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setStatus({ type: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const fail = (message) => {
    xhrRef.current = null;
    setStatus({ type: "error", message });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append(fieldName, file);

    // XMLHttpRequest plutôt que fetch : seul moyen d'avoir la progression de l'envoi
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.responseType = "blob"; // le serveur renvoie le fichier Excel

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    // Envoi terminé : le serveur convertit maintenant
    xhr.upload.onload = () => {
      setProgress(100);
      setStatus({ type: "converting" });
    };

    xhr.onload = async () => {
      xhrRef.current = null;

      if (xhr.status >= 200 && xhr.status < 300) {
        const name =
          filenameFromHeader(xhr.getResponseHeader("Content-Disposition")) ||
          `${file.name.replace(/\.[^.]+$/, "")}.xlsx`;
        const blobUrl = URL.createObjectURL(xhr.response);

        setResult({ url: blobUrl, name });
        setStatus({ type: "success" });
        if (autoDownload) triggerDownload(blobUrl, name);
        return;
      }

      // En cas d'erreur, le corps (blob) contient souvent du JSON { detail: "..." }
      let message = `Erreur serveur (${xhr.status}).`;
      try {
        const data = JSON.parse(await xhr.response.text());
        message = data?.detail ?? data?.message ?? message;
      } catch {
        /* corps non JSON */
      }
      setStatus({ type: "error", message });
    };

    xhr.onerror = () => fail("Impossible de joindre le serveur.");

    xhr.onabort = () => {
      xhrRef.current = null;
      setProgress(0);
      setStatus({ type: "idle" });
    };

    setResult(null);
    setProgress(0);
    setStatus({ type: "uploading" });
    xhr.open("POST", url);
    xhr.send(formData);
  };

  return (
    // Centrage horizontal + vertical sur toute la page
    <div className="container min-vh-100 d-flex justify-content-center align-items-center py-4">
      <div className="card shadow-sm w-100" style={{ maxWidth: 520 }}>
        <div className="card-body p-4">
          <h5 className="card-title mb-1">SQLite vers Excel</h5>
          <p className="text-body-secondary small mb-4">
            Envoie ta base de données, tu récupères un fichier .xlsx.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="file-input" className="form-label">
                Base SQLite
              </label>
              <input
                ref={inputRef}
                id="file-input"
                type="file"
                className="form-control"
                accept={accept}
                onChange={handleChange}
                disabled={busy}
              />
              <div className="form-text">
                Taille maximale : {formatSize(maxSizeMb * 1024 * 1024)}
              </div>
            </div>

            {file && (
              <p className="small text-body-secondary mb-3">
                {file.name} — {formatSize(file.size)}
              </p>
            )}

            {status.type === "uploading" && (
              <div
                className="progress mb-3"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  style={{ width: `${progress}%` }}
                >
                  {progress}%
                </div>
              </div>
            )}

            {status.type === "converting" && (
              <div className="alert alert-info d-flex align-items-center py-2" role="status">
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Conversion en Excel en cours…
              </div>
            )}

            {status.type === "success" && result && (
              <div className="alert alert-success py-2" role="alert">
                Conversion terminée : <strong>{result.name}</strong>
              </div>
            )}

            {status.type === "error" && (
              <div className="alert alert-danger py-2" role="alert">
                {status.message}
              </div>
            )}

            <div className="d-flex flex-wrap gap-2">
              {status.type === "success" && result ? (
                <>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => triggerDownload(result.url, result.name)}
                  >
                    Télécharger l'Excel
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={reset}>
                    Convertir un autre fichier
                  </button>
                </>
              ) : (
                <>
                  <button type="submit" className="btn btn-primary" disabled={!file || busy}>
                    {busy ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        {status.type === "uploading" ? "Envoi en cours" : "Conversion"}
                      </>
                    ) : (
                      "Convertir en Excel"
                    )}
                  </button>

                  {busy ? (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => xhrRef.current?.abort()}
                    >
                      Annuler
                    </button>
                  ) : (
                    file && (
                      <button type="button" className="btn btn-outline-secondary" onClick={reset}>
                        Retirer le fichier
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}