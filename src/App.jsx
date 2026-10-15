import { useMemo, useState } from 'react'
import './App.css'

const processor = [
  { name: 'i7', price: '50000' },
  { name: 'i9', price: '90000' },
  { name: 'Ryzen 7', price: '45000' },
  { name: 'Ryzen 9', price: '55000' },
]

const memories = [
  { name: '16 GB DDR4', price: '75000' },
  { name: '32 GB DDR4', price: '135000' },
  { name: '64 GB DDR4', price: '200000' },
]

const ComponentSelector = ({ title, items, selected, onSelect }) => (
  <section className="selector-card">
    <h3>{title}</h3>
    <div className="options-list">
      {items.map((item) => {
        const isSelected = selected.name === item.name

        return (
          <button
            key={`${title}-${item.name}`}
            type="button"
            className={`option-button ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(item)}
          >
            <span className="option-name">{item.name}</span>
            <span className="option-price">
              {Number(item.price).toLocaleString('hu-HU')} Ft
            </span>
          </button>
        )
      })}
    </div>
  </section>
)

export function App() {
  const [selectedProcessor, setSelectedProcessor] = useState(processor[0])
  const [selectedMemory, setSelectedMemory] = useState(memories[1])

  const totalPrice = useMemo(
    () => Number(selectedProcessor.price) + Number(selectedMemory.price),
    [selectedProcessor, selectedMemory],
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Összeszerelő alkalmazás</p>
          <h1>Számítógép konfigurátor</h1>
        </div>

        <div className="total-box">
          <span>Végösszeg</span>
          <strong>{totalPrice.toLocaleString('hu-HU')} Ft</strong>
        </div>
      </header>

      <main className="builder-grid">
        <div className="selector-stack">
          <ComponentSelector
            title="Processzor"
            items={processor}
            selected={selectedProcessor}
            onSelect={setSelectedProcessor}
          />

          <ComponentSelector
            title="Memória"
            items={memories}
            selected={selectedMemory}
            onSelect={setSelectedMemory}
          />
        </div>

        <aside className="summary-card">
          <h2>Konfiguráció</h2>

          <div className="summary-row">
            <span>Processzor</span>
            <strong>{selectedProcessor.name}</strong>
          </div>

          <div className="summary-row">
            <span>Memória</span>
            <strong>{selectedMemory.name}</strong>
          </div>

          <div className="summary-row total">
            <span>Összesen</span>
            <strong>{totalPrice.toLocaleString('hu-HU')} Ft</strong>
          </div>
        </aside>
      </main>
    </div>
  )
}
