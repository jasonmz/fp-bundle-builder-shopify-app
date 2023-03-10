import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import {
  setActiveStep,
  setBundleExtraPricePerMeal,
  setVisitedStep,
  triggerLastStep
} from '../../store/slices/rootSlice'
import { cart } from '../../../src/utils'
import SpinnerIcon from '../Global/SpinnerIcon'
import styles from './Footer.module.scss'

const Footer = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const state = useSelector((state) => state)

  const [currentStep, setCurrentStep] = useState({ id: 0 })
  const [nextStep, setNextStep] = useState({ path: '', description: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [frequency, setFrequency] = useState(0)

  const cartUtility = cart(state)

  useEffect(() => {
    if (currentStep.id !== state.steps[state.steps.length - 1].id) {
      dispatch(triggerLastStep(false))
    }
  }, [])

  useEffect(() => {
    const step = state.steps.find((step) => step.isActive)
    setCurrentStep(step)

    if (step) {
      const followingStep = state.steps.find((item) => item.id === step.id + 1)

      if (followingStep) {
        setNextStep(followingStep)
      }
    }
  }, [state.steps])

  const handleNextButtonClick = () => {
    dispatch(setActiveStep(currentStep.id + 1))
    dispatch(setVisitedStep(currentStep.id + 1))

    if (nextStep) {
      history.push(nextStep.path)
    }
  }

  const handleLastStep = () => {
    dispatch(triggerLastStep(true))
    setIsLoading(true)
  }

  const getSubTotal = () => {
    return cartUtility.calculateSubTotal(
      state.bundle?.price,
      state.bundle?.breakfast?.price,
      state.bundle?.entreesQuantity,
      state.bundle?.breakfastsQuantity,
      state.bundle?.shippingPrice
    )
  }

  useEffect(() => {
    const subTotal = getSubTotal()

    const { extraPricePerMeal, extraEntreePrice, extraBreakfastPrice } =
      cartUtility.getExtraSubTypePrice(state.entreeType, state.entreeSubType)

    setTotal(subTotal + extraEntreePrice + extraBreakfastPrice)
    dispatch(setBundleExtraPricePerMeal(extraPricePerMeal))

    const currentBreakfastQuantities =
      state.bundle &&
      state.bundle.breakfast?.name &&
      state.bundle.breakfast?.name.toLowerCase() === 'none'
        ? 0
        : state.bundle?.breakfastsQuantity
    setFrequency(state.bundle?.entreesQuantity + currentBreakfastQuantities)
  }, [state.bundle, state.entreeType, state.entreeSubType])
  const isF2Meals = process.env.STORE_SETTINGS_KEY === 'f2meals'
  return (
    <div className={`${styles.wrapper} defaultWrapper`}>
      <div className={`${styles.buttons} buttons`}>
        <div className={`${styles.info}`}>
          <span className={`${styles.infoCost}`}>
            ${Number.parseFloat(total).toFixed(2)}/week for
          </span>
          <span className={`${styles.infoFrequency}`}>
            {`${frequency} ${frequency !== 1 ? 'Meals' : 'Meal'}`}{' '}
          </span>
        </div>
        <div
          className={`button ${styles.buttonFooter} ${
            state.isNextButtonActive ? 'primaryButton' : 'disabledButton'
          } ${isF2Meals ? styles.arrowButton : ''}`}
          onClick={() => {
            if (currentStep.id === state.steps[state.steps.length - 1].id) {
              return handleLastStep()
            }
            return state.isNextButtonActive && handleNextButtonClick()
          }}
        >
          {isLoading ? <SpinnerIcon /> : currentStep.labelFooter || 'Next'}
        </div>
      </div>
    </div>
  )
}

export default Footer
