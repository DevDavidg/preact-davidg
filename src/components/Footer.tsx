import { useCopy } from '../i18n/copy'
import { useInView } from '../hooks/useInView'

export const Footer = () => {
  const { copy, locale } = useCopy()
  const { ref, inView } = useInView<HTMLElement>()

  return (
    <footer ref={ref} className="footer" data-shown={inView}>
      <span className="shard shard--fine">{copy.footer.copyright}</span>
      <span className="shard shard--fine">{copy.footer.signature}</span>
      <span className="shard shard--fine">{locale.toUpperCase()}</span>
    </footer>
  )
}
