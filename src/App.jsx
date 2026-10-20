import { useEffect, useMemo, useState } from 'react'
import './App.css'

export function App() {
  const API_URL = 'https://flat007.runasp.net/api/ComputerShop'

  // Állapotok az adatbázisból betöltött adatokhoz
  const [categories, setCategories] = useState([])
  const [components, setComponents] = useState([])
  const [osystems, setOsystems] = useState([])
  const [savedComputers, setSavedComputers] = useState([])

  // Kiválasztott elemek a konfigurátorban
  const [selectedBrand, setSelectedBrand] = useState('Custom PC')
  const [selectedType, setSelectedType] = useState('Gamer')
  const [selectedOsId, setSelectedOsId] = useState('')
  const [selectedComponents, setSelectedComponents] = useState({}) // { categoryId: componentObject }

  // Új alkatrész form állapota kategóriánként
  const [newComponentForms, setNewComponentForms] = useState({})

  // Visszajelzés mentéskor
  const [message, setMessage] = useState('')

  // Adatok lekérése a backend API-ról betöltéskor
  const loadData = async () => {
    try {
      const catRes = await fetch(`${API_URL}/categories`)
      if (catRes.ok) setCategories(await catRes.json())

      const compRes = await fetch(`${API_URL}/components`)
      if (compRes.ok) setComponents(await compRes.json())

      const osRes = await fetch(`${API_URL}/osystems`)
      if (osRes.ok) {
        const osData = await osRes.json()
        setOsystems(osData)
        if (osData.length > 0 && !selectedOsId) setSelectedOsId(osData[0].id)
      }

      const compListRes = await fetch(`${API_URL}/computers`)
      if (compListRes.ok) setSavedComputers(await compListRes.json())
    } catch (err) {
      console.error('Hiba az adatok betöltésekor:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Alkatrész kiválasztása kategóriánként
  const handleSelectComponent = (categoryId, component) => {
    setSelectedComponents(prev => ({
      ...prev,
      [categoryId]: component
    }))
  }

  // Új alkatrész input mezőinek kezelése
  const handleNewComponentChange = (categoryId, field, value) => {
    setNewComponentForms(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value
      }
    }))
  }

  // Új alkatrész mentése az adatbázisba
  const handleCreateComponent = async (categoryId) => {
    const form = newComponentForms[categoryId]
    if (!form || !form.name || !form.price) {
      alert('A név és az ár megadása kötelező!')
      return
    }

    const payload = {
      categoryId: Number(categoryId),
      name: form.name,
      price: Number(form.price),
      description: form.description || '',
      imageUrl: form.imageUrl || ''
    }

    try {
      const response = await fetch(`${API_URL}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setNewComponentForms(prev => ({ ...prev, [categoryId]: { name: '', price: '', description: '', imageUrl: '' } }))
        loadData()
        setMessage('Alkatrész sikeresen létrehozva!')
      } else {
        setMessage('Hiba az alkatrész mentésekor.')
      }
    } catch (error) {
      console.error('Hálózati hiba:', error)
      setMessage('Nem sikerült elérni a szervert.')
    }
  }

  // Dinamikusan megkeressük a memóriát (RAM) és a monitort a kiválasztott alkatrészekből vagy kategóriákból
  // Feltételezve, hogy a kategória neve tartalmazza a "RAM" vagy "Memória" / "Monitor" vagy "Kijelző" szót, 
  // vagy a kategória slug-ja alapján azonosítjuk be.
  const memoryComponent = useMemo(() => {
    const ramCategory = categories.find(c => c.name.toLowerCase().includes('memória') || c.slug === 'ram' || c.name.toLowerCase().includes('ram'))
    return ramCategory ? selectedComponents[ramCategory.categoryId] : null
  }, [categories, selectedComponents])

  const monitorComponent = useMemo(() => {
    const monitorCategory = categories.find(c => c.name.toLowerCase().includes('monitor') || c.name.toLowerCase().includes('kijelző') || c.slug === 'monitor')
    return monitorCategory ? selectedComponents[monitorCategory.categoryId] : null
  }, [categories, selectedComponents])

  // Kinyerjük a memória számértékét (pl. "16 GB DDR4" -> 16), ha nincs, akkor 0
  const calculatedMemorySize = useMemo(() => {
    if (!memoryComponent) return 0
    const match = memoryComponent.name.match(/\d+/)
    return match ? Number(match[0]) : 0
  }, [memoryComponent])

  // Kinyerjük a kijelző/monitor méretét, ha nincs, akkor "N/A"
  const calculatedDisplaySize = useMemo(() => {
    if (!monitorComponent) return 'N/A'
    // Ha a leírásban vagy névben van méret (pl. 27" vagy 27), azt adjuk vissza, különben a nevét/leírását
    return monitorComponent.description || monitorComponent.name
  }, [monitorComponent])

  // Végösszeg kiszámítása
  const totalPrice = useMemo(() => {
    return Object.values(selectedComponents).reduce(
      (sum, comp) => sum + Number(comp.price),
      0
    )
  }, [selectedComponents])

  // Konfiguráció mentése az adatbázisba
  const handleSaveConfiguration = async () => {
    const componentIds = Object.values(selectedComponents).map(c => c.componentId)

    const payload = {
      brand: selectedBrand,
      type: selectedType,
      display: monitorComponent ? 27.0 : 0.0, // Példa vagy kinyert numerikus érték a kijelzőhöz
      memory: calculatedMemorySize,
      osId: selectedOsId,
      price: totalPrice,
      componentIds: componentIds
    }

    try {
      const response = await fetch(`${API_URL}/computers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        setMessage('Sikeres konfig mentés! ID: ' + result.computerId)
        loadData()
      } else {
        setMessage('Hiba történt a konfiguráció mentése során.')
      }
    } catch (error) {
      console.error('Hálózati hiba:', error)
      setMessage('Nem sikerült elérni a szervert.')
    }
  }

  return (
    <div className="app-shell">
      
      {/* Fejléc */}
      <header className="app-header">
        <div>
          <p className="eyebrow">Adatbázis alapú összeszerelő</p>
          <h1>Számítógép konfigurátor</h1>
        </div>

        <div className="total-box">
          <span>Végösszeg</span>
          <strong className="total-price-text">{totalPrice.toLocaleString('hu-HU')} Ft</strong>
        </div>
      </header>

      {message && <div className="message-banner">{message}</div>}

      <main className="builder-grid">
        
        {/* Bal oldalsó oszlop: Adatok és kategóriák */}
        <div className="selector-stack">
          
          {/* Alap adatok */}
          <section className="selector-card">
            <h3>Konfiguráció adatai</h3>
            <div className="form-group-stack">
              <label className="form-label">
                Márka (Brand):
                <input type="text" className="form-input" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} />
              </label>
              <label className="form-label">
                Típus (Type):
                <input type="text" className="form-input" value={selectedType} onChange={e => setSelectedType(e.target.value)} />
              </label>
              
              {/* Automatikusan megjelenő Memória */}
              <div className="form-label">
                Kiválasztott Memória:
                <div className="readonly-value-box">
                  {memoryComponent ? `${memoryComponent.name} (${calculatedMemorySize} GB)` : 'Nincs kiválasztva memória'}
                </div>
              </div>

              {/* Automatikusan megjelenő Kijelző / Monitor */}
              <div className="form-label">
                Kijelző / Monitor:
                <div className="readonly-value-box">
                  {calculatedDisplaySize}
                </div>
              </div>

              <label className="form-label">
                Operációs Rendszer:
                <select className="form-select" value={selectedOsId} onChange={e => setSelectedOsId(e.target.value)}>
                  {osystems.map(os => (
                    <option key={os.id} value={os.id}>{os.name} (v{os.version})</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Kategóriák és alkatrészek */}
          {categories.map(category => {
            const itemsForCategory = components.filter(c => c.categoryId === category.categoryId)
            const currentForm = newComponentForms[category.categoryId] || { name: '', price: '', description: '', imageUrl: '' }

            return (
              <section key={category.categoryId} className="selector-card">
                <h3>{category.name}</h3>
                
                <div className="options-list">
                  {itemsForCategory.length === 0 && <p className="empty-text">Még nincsenek alkatrészek ebben a kategóriában.</p>}
                  
                  {itemsForCategory.map(item => {
                    const isSelected = selectedComponents[category.categoryId]?.componentId === item.componentId

                    return (
                      <button
                        key={item.componentId}
                        type="button"
                        className={`option-button ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectComponent(category.categoryId, item)}
                      >
                        <div>
                          <strong className="item-name">{item.name}</strong>
                          {item.description && <span className="item-desc">{item.description}</span>}
                        </div>
                        <span className={`item-price-badge ${isSelected ? 'selected' : ''}`}>
                          {Number(item.price).toLocaleString('hu-HU')} Ft
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Új alkatrész űrlap */}
                <div className="new-component-box">
                  <h4 className="new-component-title">+ Új {category.name} felvitele</h4>
                  <div className="form-row-grid">
                    <input 
                      type="text" 
                      placeholder="Alkatrész neve" 
                      className="form-input"
                      value={currentForm.name} 
                      onChange={e => handleNewComponentChange(category.categoryId, 'name', e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Ár (Ft)" 
                      className="form-input"
                      value={currentForm.price} 
                      onChange={e => handleNewComponentChange(category.categoryId, 'price', e.target.value)}
                    />
                  </div>
                  <div className="form-row-grid mb-12">
                    <input 
                      type="text" 
                      placeholder={'Leírás / Méret (pl. 27" vagy 32GB)'} 
                      className="form-input"
                      value={currentForm.description} 
                      onChange={e => handleNewComponentChange(category.categoryId, 'description', e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Kép URL" 
                      className="form-input"
                      value={currentForm.imageUrl} 
                      onChange={e => handleNewComponentChange(category.categoryId, 'imageUrl', e.target.value)}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={() => handleCreateComponent(category.categoryId)}
                  >
                    Alkatrész mentése
                  </button>
                </div>
              </section>
            )
          })}
        </div>

        {/* Jobb oldalsó oszlop */}
        <div className="sidebar-column">
          
          {/* Konfiguráció összegzés */}
          <div className="summary-card sticky-card">
            <h2>Kiválasztott konfig</h2>

            <div className="summary-row">
              <span className="summary-label">Márka / Típus</span>
              <span className="summary-value">{selectedBrand} ({selectedType})</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Memória</span>
              <span className="summary-value">{calculatedMemorySize} GB</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Kijelző</span>
              <span className="summary-value">{calculatedDisplaySize}</span>
            </div>

            {Object.entries(selectedComponents).map(([catId, comp]) => (
              <div key={catId} className="summary-row">
                <span className="summary-label">Alkatrész</span>
                <span className="summary-value right-aligned">{comp.name}</span>
              </div>
            ))}

            <div className="summary-row total">
              <span>Összesen</span>
              <span className="summary-total-price">{totalPrice.toLocaleString('hu-HU')} Ft</span>
            </div>

            <button 
              type="button" 
              className="save-button" 
              onClick={handleSaveConfiguration}
            >
              Konfiguráció mentése adatbázisba
            </button>
          </div>

          {/* Mentett gépek listája */}
          <div className="summary-card">
            <h3>Mentett konfigurációk ({savedComputers.length})</h3>
            <div className="saved-list-container">
              {savedComputers.length === 0 && <p className="empty-text">Még nincsenek elmentett konfigurációk.</p>}

              {savedComputers.map(pc => (
                <div key={pc.id} className="saved-pc-item">
                  <div className="saved-pc-title">{pc.brand} - {pc.type}</div>
                  <div className="saved-pc-details">OS: {pc.osName} | Memória: {pc.memory}GB</div>
                  <div className="saved-pc-details">Kijelző: {pc.display || 'N/A'}" | Ár: <strong className="saved-pc-price">{Number(pc.price).toLocaleString('hu-HU')} Ft</strong></div>
                  
                  {pc.components && pc.components.length > 0 && (
                    <div className="saved-pc-comps">
                      <strong>Alkatrészek:</strong>
                      <ul className="saved-comp-ul">
                        {pc.components.map(c => (
                          <li key={c.componentId}>{c.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}