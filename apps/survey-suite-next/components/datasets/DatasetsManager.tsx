'use client';

import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type DatasetItem = {
  id: string;
  name: string;
  description: string | null;
  rowCount: number;
  columnCount: number;
  columns: string[] | null;
  createdAt: string;
  updatedAt: string;
};

type DatasetsManagerProps = {
  workspaceName: string;
  activeDatasetId: string | null;
  initialDatasets: DatasetItem[];
};

export function DatasetsManager({ workspaceName, activeDatasetId, initialDatasets }: DatasetsManagerProps) {
  const router = useRouter();
  const [datasets, setDatasets] = useState<DatasetItem[]>(initialDatasets);
  const [currentActiveId, setCurrentActiveId] = useState<string | null>(activeDatasetId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedDatasets = useMemo(
    () => [...datasets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [datasets]
  );

  const onCsvFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, csvText })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'No se pudo crear el dataset');
      }

      setDatasets((prev) => [result.dataset, ...prev]);
      setName('');
      setDescription('');
      setCsvText('');
      setSuccess('Dataset creado correctamente.');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear dataset';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const setAsActive = async (datasetId: string) => {
    setSettingActiveId(datasetId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/active-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'No se pudo seleccionar dataset activo');
      }

      setCurrentActiveId(result.activeDataset?.id || datasetId);
      setSuccess('Dataset activo actualizado.');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar dataset activo';
      setError(message);
    } finally {
      setSettingActiveId(null);
    }
  };

  return (
    <div className="datasets-layout">
      <div className="card">
        <h1>Mis datasets</h1>
        <p className="muted">Workspace activo: <strong>{workspaceName}</strong></p>

        <form className="dataset-form" onSubmit={submit}>
          <label>
            Nombre del dataset
            <input
              type="text"
              minLength={2}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Encuesta pre test"
            />
          </label>

          <label>
            Descripción (opcional)
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Grupo, periodo, observaciones"
            />
          </label>

          <label>
            CSV desde archivo
            <input type="file" accept=".csv,text/csv" onChange={onCsvFileChange} />
          </label>

          <label>
            CSV (pegar texto)
            <textarea
              rows={8}
              required
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={'id,item_1,item_2\n1,4,5\n2,3,4'}
            />
          </label>

          {error ? <p className="error">{error}</p> : null}
          {success ? <p style={{ color: '#166534', margin: 0 }}>{success}</p> : null}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar dataset'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Datasets disponibles</h2>
        {sortedDatasets.length === 0 ? (
          <p className="muted">Todavía no has creado datasets.</p>
        ) : (
          <div className="table-wrap">
            <table className="datasets-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Filas</th>
                  <th>Columnas</th>
                  <th>Creado</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                {sortedDatasets.map((dataset) => {
                  const isActive = currentActiveId === dataset.id;
                  return (
                    <tr key={dataset.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{dataset.name}</div>
                        {dataset.description ? <div className="muted">{dataset.description}</div> : null}
                      </td>
                      <td>{dataset.rowCount}</td>
                      <td>{dataset.columnCount}</td>
                      <td>{new Date(dataset.createdAt).toLocaleString()}</td>
                      <td>
                        {isActive ? (
                          <span className="active-badge">Activo</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setAsActive(dataset.id)}
                            disabled={settingActiveId === dataset.id}
                          >
                            {settingActiveId === dataset.id ? 'Actualizando...' : 'Usar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
