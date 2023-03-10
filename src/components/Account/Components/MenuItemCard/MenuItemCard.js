import React from 'react'
import styles from './MenuItemCard.module.scss'

const MenuItemCard = (props) => {
    const { image, title, quantity, type, quantityLabel = 'Qty:' } = props;
    
    return (
        <div className={`bundleBuilderCard ${styles.menuItemCard}`}>
            <div className={styles.cardImageWrapper}>
                <img className={styles.cardImage} src={image} alt={title} />
            </div>
            <div className={styles.cardContent}>
                <div className={styles.cardTitle}>
                    <h3 className={styles.menuItemTitle}>{title}</h3>
                </div>
                <div className={styles.cardInfo}>
                    <p className={styles.cardText}>
                        <strong>{type}</strong>
                    </p>
                    <p className={styles.cardText}>
                        {quantityLabel} <strong>{quantity}</strong>
                    </p>
                </div>
            </div>
        </div>
    )
}
export default MenuItemCard