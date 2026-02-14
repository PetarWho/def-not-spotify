import React, { memo } from 'react'
import Typography from '@material-ui/core/Typography'
import sanitizeFieldRestProps from './sanitizeFieldRestProps'
import md5 from 'blueimp-md5'
import { useRecordContext } from 'react-admin'

export const MultiLineTextField = memo(
  ({
    className,
    emptyText,
    source,
    firstLine,
    maxLines,
    addLabel,
    ...rest
  }) => {
    const record = useRecordContext(rest)
    const value = record && record[source]
    let lines = value ? value.split('\n') : []
    
    // Filter out YouTube URLs from comments
    lines = lines.map(line => {
      // Remove YouTube URLs (http://youtube.com, https://youtube.com, youtu.be)
      return line.replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+/g, '[YouTube URL removed]')
    })
    
    if (maxLines || firstLine) {
      lines = lines.slice(firstLine, maxLines)
    }

    return (
      <Typography
        className={className}
        variant="body2"
        component="span"
        {...sanitizeFieldRestProps(rest)}
      >
        {lines.length === 0 && emptyText ? emptyText : lines}
      </Typography>
    )
  },
)

MultiLineTextField.displayName = 'MultiLineTextField'

MultiLineTextField.defaultProps = {
  addLabel: true,
  firstLine: 0,
}
