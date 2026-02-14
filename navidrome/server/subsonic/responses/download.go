package responses

type DownloadResponse struct {
	Success bool   `xml:"success" json:"success"`
	Message string `xml:"message" json:"message"`
	File    string `xml:"file,omitempty" json:"file,omitempty"`
}

type DeleteResponse struct {
	Success bool   `xml:"success" json:"success"`
	Message string `xml:"message" json:"message"`
}

type LibraryResponse struct {
	Success bool      `xml:"success" json:"success"`
	Message string    `xml:"message" json:"message"`
	Libraries []Library `xml:"libraries,omitempty" json:"libraries,omitempty"`
}

type Library struct {
	ID   string `xml:"id" json:"id"`
	Name string `xml:"name" json:"name"`
}
