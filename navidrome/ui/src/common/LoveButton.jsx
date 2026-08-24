import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import FavoriteIcon from '@material-ui/icons/Favorite'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import IconButton from '@material-ui/core/IconButton'
import { makeStyles } from '@material-ui/core/styles'
import clsx from 'clsx'
import { useToggleLove } from './useToggleLove'
import { useRecordContext } from 'react-admin'
import config from '../config'
import { isDateSet } from '../utils/validations'

const useStyles = makeStyles(
  (theme) => ({
    love: {
      visibility: (props) =>
        props.visible === false ? 'hidden' : 'visible',
      '& .MuiIconButton-label, & .MuiSvgIcon-root': {
        color: (props) =>
          (props.loved ? theme.palette.primary.main : (props.color || 'inherit')) + ' !important',
      },
      '&:hover': {
        backgroundColor: 'transparent !important',
        '& .MuiIconButton-label, & .MuiSvgIcon-root': {
          color: (props) =>
            (props.loved
              ? theme.palette.type === 'dark'
                ? theme.palette.primary.light
                : theme.palette.primary.dark
              : theme.palette.primary.main) + ' !important',
        },
      },
    },
  }),
  { name: 'NDLoveButton' },
)

export const LoveButton = ({
  resource,
  color,
  visible,
  size,
  component: Button,
  addLabel,
  disabled,
  className,
  record: recordProp,
  ...rest
}) => {
  const record = useRecordContext({ record: recordProp }) || {}
  const loved = !!(isDateSet(record.starred) || record.starred === true)
  const classes = useStyles({ color, visible, loved })
  const [toggleLove, loading] = useToggleLove(resource, record)

  const handleToggleLove = useCallback(
    (e) => {
      e.preventDefault()
      toggleLove()
      e.stopPropagation()
    },
    [toggleLove],
  )

  if (!config.enableFavourites) {
    return <></>
  }
  return (
    <Button
      onClick={handleToggleLove}
      size={'small'}
      disabled={disabled || loading || record.missing}
      className={clsx(classes.love, className)}
      title={
        isDateSet(record.starredAt)
          ? new Date(record.starredAt).toLocaleString()
          : undefined
      }
      {...rest}
    >
      {loved ? (
        <FavoriteIcon fontSize={size} />
      ) : (
        <FavoriteBorderIcon fontSize={size} />
      )}
    </Button>
  )
}

LoveButton.propTypes = {
  resource: PropTypes.string.isRequired,
  record: PropTypes.object,
  visible: PropTypes.bool,
  color: PropTypes.string,
  size: PropTypes.string,
  component: PropTypes.object,
  disabled: PropTypes.bool,
}

LoveButton.defaultProps = {
  addLabel: true,
  visible: true,
  size: 'small',
  color: 'inherit',
  component: IconButton,
  disabled: false,
}
