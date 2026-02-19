function MemoryView({ variables, statics, heap }) {
  const varEntries = variables ? Object.entries(variables) : [];
  const staticEntries = statics ? Object.entries(statics) : [];
  const heapEntries = heap ? Object.entries(heap) : [];

  const hasData = varEntries.length > 0 || staticEntries.length > 0;

  if (!hasData) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128202;</div>
        <div>No variables in scope</div>
        <div className="empty-state-sub">
          Variables will appear during execution
        </div>
      </div>
    );
  }

  return (
    <div className="memory-container">
      {varEntries.length > 0 && (
        <>
          <div className="var-section-label">Local Variables</div>
          <table className="var-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {varEntries.map(([name, info]) => (
                <tr key={name}>
                  <td className="var-name">{name}</td>
                  <td className="var-type">{info.type}</td>
                  <td className={`var-value${info.id ? " ref" : ""}`}>
                    {info.id ? (
                      <span title={info.id}>{info.value}</span>
                    ) : (
                      info.value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {staticEntries.length > 0 && (
        <>
          <div className="var-section-label">Static Fields</div>
          <table className="var-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {staticEntries.map(([name, info]) => (
                <tr key={name}>
                  <td className="var-name">{name}</td>
                  <td className="var-type">{info.type}</td>
                  <td className={`var-value${info.id ? " ref" : ""}`}>
                    {info.id ? (
                      <span title={info.id}>{info.value}</span>
                    ) : (
                      info.value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {heapEntries.length > 0 && (
        <>
          <div className="var-section-label">Heap Objects</div>
          {heapEntries.map(([refId, obj]) => (
            <div key={refId} className="heap-object">
              <div className="heap-object-header">
                <span className="heap-ref-id">{refId}</span>
                <span className="heap-type">{obj.type}</span>
              </div>
              <div className="heap-object-content">
                {obj.elements ? (
                  <div className="heap-array">
                    {obj.elements.map((el, i) => (
                      <div key={i} className="heap-array-cell">
                        <span className="heap-array-index">{i}</span>
                        <span className="heap-array-value">{el}</span>
                      </div>
                    ))}
                  </div>
                ) : obj.fields ? (
                  <div className="heap-fields">
                    {Object.entries(obj.fields).map(([fName, fVal]) => (
                      <div key={fName} className="heap-field-row">
                        <span className="heap-field-name">{fName}</span>
                        <span className="heap-field-value">{fVal}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default MemoryView;
