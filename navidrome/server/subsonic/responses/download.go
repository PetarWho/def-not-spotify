package responses

type DownloadResponse struct {
	Success bool   `xml:"success" json:"success"`
	Message string `xml:"message" json:"message"`
	File    string `xml:"file,omitempty" json:"file,omitempty"`
}
