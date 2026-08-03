import { useCopy } from '../i18n/copy'

export const Footer = () => {
  const { copy, locale } = useCopy()

  return (
    <footer className="footer">
      <span>{copy.footer.copyright}</span>
      <span>{copy.footer.signature}</span>
      <span>{locale.toUpperCase()}</span>
    </footer>
  )
}
